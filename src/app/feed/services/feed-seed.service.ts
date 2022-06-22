import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, ReplaySubject } from 'rxjs';
import { SpotifyService } from '../../core/services/spotify.service';
import { LogService } from '../../shared/services/utility/log.service';
import { LogLevel } from '../../shared/domain/utility/log-level';
import { waitParallel } from '../../utility/wait-parallel';
import { randomIntInRange } from '../../utility/random-int-in-range';
import { getRandomItems } from '../../utility/shuffled';
import { RandomSeedIds } from '../domain/random-seed-ids';
import { FeedStorageService } from './feed-storage.service';

@Injectable()
export class FeedSeedService {
	private static readonly failedToPopulateSeeds = 'Failed to populate seeds.';

	private static readonly baseMaxSeedLen = 30;
	private static readonly newToTopRatio = 4;

	private readonly initiated$: Observable<boolean>;
	private readonly randomSeeds$: Observable<RandomSeedIds>;

	private readonly initiatedS = new BehaviorSubject(false);
	private readonly randomSeedsIdsS = new ReplaySubject<RandomSeedIds>();

	private readonly maxSeedLen: number;

	private topTracksInUseCount = 0;
	private topArtistsInUseCount = 0;
	private trackSeeds: SpotifyApi.TrackObjectSimplified[] = [];
	private artistSeeds: (SpotifyApi.ArtistObjectFull | SpotifyApi.ArtistObjectSimplified)[] = [];

	constructor(
		private readonly logger: LogService,
		private readonly spotifyService: SpotifyService,
		private readonly feedStorageService: FeedStorageService
	) {
		this.initiated$ = this.initiatedS.asObservable();
		this.randomSeeds$ = this.randomSeedsIdsS.asObservable();

		this.maxSeedLen = FeedSeedService.baseMaxSeedLen * FeedSeedService.newToTopRatio;
	}

	get isInitiated$(): Observable<boolean> {
		return this.initiated$;
	}

	get randomSeedIds$(): Observable<RandomSeedIds> {
		return this.randomSeeds$;
	}

	init() {
		this.populateSeedsIfEmpty().then(() => this.initiatedS.next(true));
	}

	async addTrackSeeds(tracks: SpotifyApi.TrackObjectSimplified[]): Promise<void> {
		this.trackSeeds = await this.addSeeds(
			tracks,
			this.topTracksInUseCount,
			this.trackSeeds,
			(list) => this.storeTrackSeeds(list)
		);
	}

	async addArtistSeeds(
		artists: (SpotifyApi.ArtistObjectFull | SpotifyApi.ArtistObjectSimplified)[]
	): Promise<void> {
		this.artistSeeds = await this.addSeeds(
			artists,
			this.topArtistsInUseCount,
			this.artistSeeds,
			(list) => this.storeArtistSeeds(list)
		);
	}

	generateRandomSeedIds(totalAmount: number) {
		const useTrackCount = randomIntInRange(0, totalAmount);
		const useArtistCount = totalAmount - useTrackCount;

		const selectedTracks = getRandomItems(this.trackSeeds, useTrackCount);
		const selectedArtists = getRandomItems(this.artistSeeds, useArtistCount);

		const trackIds: string[] = selectedTracks.map((track) => track.id);
		const artistIds: string[] = selectedArtists.map((artist) => artist.id);

		this.randomSeedsIdsS.next({ trackIds, artistIds });
	}

	private async populateSeedsIfEmpty(): Promise<void> {
		let [tracks, artists] = await this.getStoredTopTracksAndArtists();

		if (!tracks || !artists) {
			this.logger.log(LogLevel.trace, 'Filling empty track and artist seeds.');

			const [topTracksResponse, topArtistsResponse] = await this.fetchTopTracksAndArtists();
			tracks = topTracksResponse?.items;
			artists = topArtistsResponse?.items;

			if (!tracks || !artists) {
				throw new Error(FeedSeedService.failedToPopulateSeeds);
			}

			await waitParallel(
				this.storeTrackAndArtistSeeds({ tracks, artists }),
				this.storedTopTrackAndArtistCounts({
					topTracksCount: tracks.length,
					topArtistsCount: artists.length
				})
			);
		} else {
			this.onPreExistingSeeds(tracks, artists);
		}

		await this.updateSeedUsageCounts();
		this.trackSeeds = tracks;
		this.artistSeeds = artists;
	}

	private onPreExistingSeeds(
		trackSeeds: SpotifyApi.TrackObjectSimplified[],
		artistSeeds: (SpotifyApi.ArtistObjectFull | SpotifyApi.ArtistObjectSimplified)[]
	) {
		this.logger.log(
			LogLevel.trace,
			`Track [${trackSeeds.length}] and artist [${artistSeeds.length}] seeds already existing.`
		);
	}

	private async updateSeedUsageCounts(): Promise<void> {
		[this.topTracksInUseCount, this.topArtistsInUseCount] =
			await this.getStoredTopTrackAndArtistCounts();
		this.logger.log(
			LogLevel.trace,
			`The first ${this.topTracksInUseCount} tracks are sourced from top tracks.`
		);
		this.logger.log(
			LogLevel.trace,
			`The first ${this.topArtistsInUseCount} artists are sourced from top artists.`
		);
	}

	private async addSeeds<
		T extends (
			| SpotifyApi.TrackObjectSimplified
			| (SpotifyApi.ArtistObjectFull | SpotifyApi.ArtistObjectSimplified)
		)[]
	>(seeds: T, seedsInUse: number, list: T, storeFn: (list: T) => Promise<void>): Promise<T> {
		const listLen = list.length;
		const insertLen = seeds.length;
		const combinedLen = listLen + insertLen;
		const maxLen = this.maxSeedLen;

		if (combinedLen > maxLen) {
			list.splice(seedsInUse, combinedLen - maxLen);
		}
		list.push(...seeds);

		await storeFn(list);

		return list;
	}

	private getStoredTopTracksAndArtists(): Promise<
		[
			SpotifyApi.TrackObjectSimplified[] | undefined,
			(SpotifyApi.ArtistObjectFull | SpotifyApi.ArtistObjectSimplified)[] | undefined
		]
	> {
		return waitParallel(
			this.feedStorageService.getTrackSeeds(),
			this.feedStorageService.getArtistSeeds()
		);
	}

	private fetchTopTracksAndArtists(): Promise<
		[
			SpotifyApi.UsersTopTracksResponse | undefined,
			SpotifyApi.UsersTopArtistsResponse | undefined
		]
	> {
		return waitParallel(
			this.spotifyService.getTopTracks(FeedSeedService.baseMaxSeedLen),
			this.spotifyService.getTopArtists(FeedSeedService.baseMaxSeedLen)
		);
	}

	private storeTrackAndArtistSeeds({
		tracks,
		artists
	}: {
		tracks: SpotifyApi.TrackObjectSimplified[];
		artists: (SpotifyApi.ArtistObjectFull | SpotifyApi.ArtistObjectSimplified)[];
	}): Promise<[void, void]> {
		return waitParallel(this.storeTrackSeeds(tracks), this.storeArtistSeeds(artists));
	}

	private storeTrackSeeds(tracks: SpotifyApi.TrackObjectSimplified[]): Promise<void> {
		return this.feedStorageService.storeTrackSeeds(tracks);
	}

	private storeArtistSeeds(
		artists: (SpotifyApi.ArtistObjectFull | SpotifyApi.ArtistObjectSimplified)[]
	): Promise<void> {
		return this.feedStorageService.storeArtistSeeds(artists);
	}

	private getStoredTopTrackAndArtistCounts(): Promise<[number, number]> {
		return waitParallel(
			this.feedStorageService.getTopTrackCount(),
			this.feedStorageService.getTopArtistCount()
		);
	}

	private storedTopTrackAndArtistCounts({
		topTracksCount,
		topArtistsCount
	}: {
		topTracksCount: number;
		topArtistsCount: number;
	}): Promise<[void, void]> {
		return waitParallel(
			this.feedStorageService.storeTopTrackCount(topTracksCount),
			this.feedStorageService.storeTopArtistCount(topArtistsCount)
		);
	}
}
