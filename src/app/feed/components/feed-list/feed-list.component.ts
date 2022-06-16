import { ChangeDetectionStrategy, Component, OnDestroy, OnInit } from '@angular/core';
import { filter, ReplaySubject, takeUntil } from 'rxjs';
import { FeedService } from '../../services/feed.service';
import { FeedSeedService } from '../../services/feed-seed.service';
import { LogService } from '../../../core/services/utility/log.service';
import { LogLevel } from '../../../domain/utility/log-level';
import TrackObjectSimplified = SpotifyApi.TrackObjectSimplified;

@Component({
	selector: 'app-feed-list',
	templateUrl: './feed-list.component.html',
	styleUrls: ['./feed-list.component.scss'],
	changeDetection: ChangeDetectionStrategy.OnPush,
	providers: [FeedSeedService, FeedService]
})
export class FeedListComponent implements OnInit, OnDestroy {
	private static readonly elementCount = 6;

	activeTracks: SpotifyApi.TrackObjectSimplified[] = [];
	cardQueue: SpotifyApi.TrackObjectSimplified[] = [];

	private readonly destroyedS = new ReplaySubject(1);

	constructor(private readonly logger: LogService, private readonly feedService: FeedService) {}

	ngOnInit() {
		this.feedService.isInitiated$
			.pipe(
				filter((isInitiated) => isInitiated),
				takeUntil(this.destroyedS)
			)
			.subscribe(() => {
				this.feedService.triggerRecommendations();
			});

		this.feedService.recommendedTracks$
			.pipe(takeUntil(this.destroyedS))
			.subscribe((tracks) => console.log('TRACKS', tracks));

		this.feedService.init();
	}

	ngOnDestroy() {
		this.destroyedS.next(true);
		this.destroyedS.complete();
	}

	onLikeTrack(track: TrackObjectSimplified): Promise<[void, void]> {
		this.logger.log(LogLevel.trace, `Liked track '${track.name}'`);
		return this.feedService.likeTrack(track);
	}

	onDislikeTrack(track: TrackObjectSimplified) {
		this.logger.log(LogLevel.trace, `Disliked track '${track.name}'`);
	}
}