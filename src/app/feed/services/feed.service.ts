import { Injectable, OnDestroy } from '@angular/core';
import { BehaviorSubject, filter, Observable, ReplaySubject, takeUntil } from 'rxjs';
import { SpotifyService } from '../../core/services/spotify.service';
import { waitParallel } from '../../utility/wait-parallel';
import { RecommendedCard } from '../domain/recommended-card';
import { waitTime } from '../../utility/wait-time';
import { FeedSeedService } from './feed-seed.service';
import { FeedStorageService } from './feed-storage.service';

@Injectable()
export class FeedService implements OnDestroy {
	private static readonly likeBatchThrottleMs = 4000;
	private static readonly retryOnEmptyFilteredMs = 2000;
	private static readonly totalSeedsForRecommendation = 5;
	private static readonly defaultMaxFetchAmount = 10;
	private static readonly maxHistoryLen = 300;

	private readonly initiated$: Observable<boolean>;
	private readonly recommended$: Observable<RecommendedCard[]>;

	private readonly initiatedS = new BehaviorSubject(false);
	private readonly recommendedS = new ReplaySubject<RecommendedCard[]>();
	private readonly destroyedS = new ReplaySubject(1);

	private readonly likeBatch: string[] = [];
	private likeBatchTimer?: ReturnType<typeof setTimeout>;

	private maxFetchAmount = FeedService.defaultMaxFetchAmount;

	constructor(
		private readonly spotifyService: SpotifyService,
		private readonly feedSeedService: FeedSeedService,
		private readonly feedStorageService: FeedStorageService
	) {
		this.initiated$ = this.initiatedS.asObservable();
		this.recommended$ = this.recommendedS.asObservable();

		this.setupObservables();
	}

	get isInitiated$(): Observable<boolean> {
		return this.initiated$;
	}

	get recommendedCards$(): Observable<RecommendedCard[]> {
		return this.recommended$;
	}

	setFetchAmount(amount: number) {
		this.maxFetchAmount = amount;
	}

	ngOnDestroy() {
		clearTimeout(this.likeBatchTimer);
		this.flushLikeBatch();

		this.destroyedS.next(true);
		this.destroyedS.complete();
	}

	init() {
		this.feedSeedService.init();
	}

	triggerRecommendations() {
		this.feedSeedService.generateRandomSeedIds(FeedService.totalSeedsForRecommendation);
	}

	dislikeTrack(track: SpotifyApi.TrackObjectSimplified): Promise<void> {
		return this.saveUsedIdsInHistory([track.id]);
	}

	likeTrack(track: SpotifyApi.TrackObjectSimplified): Promise<[void, void, void]> {
		this.likeBatch.push(track.id);
		this.scheduleLikesFlush();

		return waitParallel(
			this.saveUsedIdsInHistory([track.id]),
			this.feedSeedService.addTrackSeeds([track]),
			this.feedSeedService.addArtistSeeds(track.artists)
		);
	}

	flushLikeBatch() {
		const batch = this.likeBatch;
		if (batch.length) {
			this.spotifyService
				.likeTracks([...this.likeBatch])
				.then(() => (this.likeBatchTimer = undefined));
			this.likeBatch.length = 0;
		}
	}

	private setupObservables() {
		this.feedSeedService.isInitiated$
			.pipe(
				filter((isInitiated) => isInitiated),
				takeUntil(this.destroyedS)
			)
			.subscribe((initiated) => this.initiatedS.next(initiated));

		this.feedSeedService.randomSeedIds$
			.pipe(takeUntil(this.destroyedS))
			.subscribe(({ trackIds, artistIds }) => this.onNewRandomSeeds(trackIds, artistIds));
	}

	private async onNewRandomSeeds(artistIds: string[], trackIds: string[]): Promise<void> {
		const response = await this.spotifyService.getRecommendations(
			this.maxFetchAmount,
			artistIds,
			trackIds
		);
		const recommendedCards = await this.getRecommendedCards(response);
		if (recommendedCards) {
			this.recommendedS.next(recommendedCards);
		}
	}

	private async getRecommendedCards(
		response: SpotifyApi.RecommendationsFromSeedsResponse | undefined
	): Promise<RecommendedCard[] | undefined> {
		if (!response) {
			return [];
		}

		const [trackIds, artistIds] = await this.filterPreviewableAndUnusedIds(response);

		if (!trackIds.length) {
			await waitTime(FeedService.retryOnEmptyFilteredMs);
			this.triggerRecommendations();
			return;
		}

		const [trackResponse, artistResponse, featureResponse] = await waitParallel(
			this.spotifyService.getDetailedTracks(trackIds),
			this.spotifyService.getDetailedArtists(artistIds),
			this.spotifyService.getTrackFeatures(trackIds)
		);

		if (!trackResponse || !artistResponse || !featureResponse) {
			return [];
		}

		const tracks = trackResponse.tracks;
		const artists = artistResponse.artists;
		const features = featureResponse.audio_features;
		const trackLen = tracks.length;

		const recommendations: RecommendedCard[] = new Array(trackLen);
		for (let i = 0; i < trackLen; i++) {
			recommendations[i] = {
				track: tracks[i],
				primaryArtist: artists[i],
				features: features[i]
			};
		}

		return recommendations;
	}

	private async filterPreviewableAndUnusedIds(
		response: SpotifyApi.RecommendationsFromSeedsResponse
	): Promise<[trackIds: string[], artistIds: string[]]> {
		const outTracks: string[] = [];
		const outArtists: string[] = [];
		const tracks = response.tracks;
		const trackLen = tracks.length;
		const historyTrackIds = await this.feedStorageService.getTrackIdsHistory();

		for (let i = 0; i < trackLen; i++) {
			const track = tracks[i];
			const trackId = track.id;
			if (track.preview_url && !historyTrackIds.includes(trackId)) {
				outTracks.push(trackId);
				outArtists.push(track.artists?.[0].id);
			}
		}

		return [outTracks, outArtists];
	}

	private async saveUsedIdsInHistory(trackIds: string[]) {
		const trackLen = trackIds.length;
		const historyTrackIds = await this.feedStorageService.getTrackIdsHistory();
		const currentLen = historyTrackIds.length;
		const combinedLen = currentLen + trackLen;
		const maxLen = FeedService.maxHistoryLen;

		if (combinedLen > maxLen) {
			historyTrackIds.splice(0, combinedLen - maxLen);
		}
		historyTrackIds.push(...trackIds);

		return this.feedStorageService.storeTrackIdsHistory(historyTrackIds);
	}

	private scheduleLikesFlush() {
		if (!this.likeBatchTimer) {
			this.likeBatchTimer = setTimeout(
				() => this.flushLikeBatch(),
				FeedService.likeBatchThrottleMs
			);
		}
	}
}
