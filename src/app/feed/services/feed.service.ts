import { Injectable, OnDestroy } from '@angular/core';
import { BehaviorSubject, filter, Observable, ReplaySubject, takeUntil } from 'rxjs';
import { SpotifyService } from '../../core/services/spotify.service';
import { waitParallel } from '../../utility/wait-parallel';
import { FeedSeedService } from './feed-seed.service';
import TrackObjectSimplified = SpotifyApi.TrackObjectSimplified;

@Injectable()
export class FeedService implements OnDestroy {
	private static readonly totalSeedsForRecommendation = 5;

	private readonly initiated$: Observable<boolean>;
	private readonly tracks$: Observable<TrackObjectSimplified[]>;

	private readonly initiatedS = new BehaviorSubject(false);
	private readonly trackS = new ReplaySubject<TrackObjectSimplified[]>();
	private readonly destroyedS = new ReplaySubject(1);

	constructor(
		private readonly spotifyService: SpotifyService,
		private readonly feedSeedService: FeedSeedService
	) {
		this.initiated$ = this.initiatedS.asObservable();
		this.tracks$ = this.trackS.asObservable();

		this.feedSeedService.isInitiated$
			.pipe(
				filter((isInitiated) => isInitiated),
				takeUntil(this.destroyedS)
			)
			.subscribe((initiated) => this.initiatedS.next(initiated));

		this.feedSeedService.randomSeeds$
			.pipe(takeUntil(this.destroyedS))
			.subscribe(({ trackIds, artistIds }) => this.onNewRandomSeeds(trackIds, artistIds));
	}

	get isInitiated$(): Observable<boolean> {
		return this.initiated$;
	}

	get recommendedTracks$(): Observable<TrackObjectSimplified[]> {
		return this.tracks$;
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

	likeTrack(track: TrackObjectSimplified): Promise<[void, void]> {
		return waitParallel(
			this.feedSeedService.addTrackSeeds([track]),
			this.feedSeedService.addArtistSeeds(track.artists)
		);
	}

	private async onNewRandomSeeds(artistIds: string[], trackIds: string[]): Promise<void> {
		const response = await this.spotifyService.getRecommendations(20, artistIds, trackIds);
		const recommendedTracks = await this.handleResponse(response);
		this.trackS.next(recommendedTracks);
	}

	private async handleResponse(
		response: SpotifyApi.RecommendationsFromSeedsResponse | undefined
	): Promise<SpotifyApi.TrackObjectSimplified[]> {
		if (!response) {
			return [];
		}

		return this.filterPreviewable(response);
	}

	private filterPreviewable(
		response: SpotifyApi.RecommendationsFromSeedsResponse
	): SpotifyApi.TrackObjectSimplified[] {
		const out: SpotifyApi.TrackObjectSimplified[] = [];
		const tracks = response.tracks;
		const trackLen = tracks.length;

		for (let i = 0; i < trackLen; i++) {
			const track = tracks[i];
			if (tracks[i].preview_url) {
				out.push(track);
			}
		}

		return out;
	}
}
