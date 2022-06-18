import { Injectable, OnDestroy } from '@angular/core';
import { BehaviorSubject, filter, Observable, ReplaySubject, takeUntil } from 'rxjs';
import { SpotifyService } from '../../core/services/spotify.service';
import { waitParallel } from '../../utility/wait-parallel';
import { RecommendedCard } from '../domain/recommended-card';
import { waitTime } from '../../utility/wait-time';
import { FeedSeedService } from './feed-seed.service';

@Injectable()
export class FeedService implements OnDestroy {
	private static readonly retryOnEmptyFilteredMs = 2000;
	private static readonly totalSeedsForRecommendation = 5;

	private readonly initiated$: Observable<boolean>;
	private readonly recommended$: Observable<RecommendedCard[]>;

	private readonly initiatedS = new BehaviorSubject(false);
	private readonly recommendedS = new ReplaySubject<RecommendedCard[]>();
	private readonly destroyedS = new ReplaySubject(1);

	constructor(
		private readonly spotifyService: SpotifyService,
		private readonly feedSeedService: FeedSeedService
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

	ngOnDestroy() {
		this.destroyedS.next(true);
		this.destroyedS.complete();
	}

	init() {
		this.feedSeedService.init();
	}

	triggerRecommendations() {
		this.feedSeedService.generateRandomSeedIds(FeedService.totalSeedsForRecommendation);
	}

	likeTrack(track: SpotifyApi.TrackObjectSimplified): Promise<[void, void]> {
		return waitParallel(
			this.feedSeedService.addTrackSeeds([track]),
			this.feedSeedService.addArtistSeeds(track.artists)
		);
	}

	private setupObservables(): void {
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
		const response = await this.spotifyService.getRecommendations(20, artistIds, trackIds);
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

		const [trackIds, artistIds] = this.filterPreviewableIds(response);

		if (!trackIds.length) {
			await waitTime(FeedService.retryOnEmptyFilteredMs);
			this.triggerRecommendations();
			return undefined;
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

	private filterPreviewableIds(
		response: SpotifyApi.RecommendationsFromSeedsResponse
	): [trackIds: string[], artistIds: string[]] {
		const outTracks: string[] = [];
		const outArtists: string[] = [];
		const tracks = response.tracks;
		const trackLen = tracks.length;

		for (let i = 0; i < trackLen; i++) {
			const track = tracks[i];
			if (tracks[i].preview_url) {
				outTracks.push(track.id);
				outArtists.push(track.artists[0].id);
			}
		}

		return [outTracks, outArtists];
	}
}
