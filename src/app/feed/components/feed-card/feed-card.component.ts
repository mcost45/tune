import {
	ChangeDetectionStrategy,
	Component,
	ElementRef,
	Input,
	NgZone,
	OnChanges,
	OnDestroy,
	OnInit,
	Renderer2,
	SimpleChanges
} from '@angular/core';
import { BehaviorSubject, filter, interval, map, ReplaySubject, retry, takeUntil } from 'rxjs';
import { tap } from 'rxjs/operators';
import { RecommendedCard } from '../../domain/recommended-card';
import { InteractedService } from '../../../shared/services/interacted.service';
import { waitTime } from '../../../utility/wait-time';
import { runOutsideZone } from '../../../utility/run-outside-zone';
import { runInZone } from '../../../utility/run-in-zone';
import { ConfigService } from '../../../shared/services/utility/config.service';
import { LogService } from '../../../shared/services/utility/log.service';
import { LogLevel } from '../../../shared/domain/utility/log-level';

@Component({
	selector: 'app-feed-card',
	templateUrl: './feed-card.component.html',
	styleUrls: ['./feed-card.component.scss'],
	changeDetection: ChangeDetectionStrategy.OnPush
})
export class FeedCardComponent implements OnInit, OnChanges, OnDestroy {
	@Input() recommendation?: RecommendedCard;
	@Input() index?: number;
	@Input() transitionDurationMs?: string;

	isFirst = false;
	maxTitleCharLen = 34;
	overlayFadeStrengthPercentage = 55;

	private previewAudio?: HTMLAudioElement;

	private readonly destroyedS = new ReplaySubject(1);
	private readonly progressS = new BehaviorSubject(0);
	private readonly progress$ = this.progressS.asObservable();

	constructor(
		private readonly zone: NgZone,
		private readonly logger: LogService,
		private readonly configService: ConfigService,
		private readonly interactedService: InteractedService,
		private readonly renderer: Renderer2,
		private readonly self: ElementRef
	) {}

	get playProgress$() {
		return this.progress$;
	}

	ngOnInit() {
		this.prepCard();
	}

	ngOnChanges(changes: SimpleChanges) {
		const indexChange = changes.index;
		if (indexChange && !indexChange.firstChange) {
			this.prepCard();
		}
	}

	ngOnDestroy() {
		this.previewAudio?.pause();
		this.previewAudio = undefined;

		this.destroyedS.next(true);
		this.destroyedS.complete();
	}

	private prepCard() {
		this.isFirst = this.index === 0;
		this.previewAudio?.pause();

		this.zone.runOutsideAngular(() => {
			this.prepAudioIfFirst();
			this.prepTransition();
		});
	}

	private prepAudioIfFirst() {
		const config = this.configService.config.playback;
		const recommendation = this.recommendation;

		if (this.isFirst && recommendation) {
			this.previewAudio = new Audio(recommendation.track.preview_url);
			this.previewAudio.volume = config.volume || 1;
			this.previewAudio.loop = config.loop;

			this.interactedService.hasInteracted$
				.pipe(
					runOutsideZone(this.zone),
					filter((hasInteracted) => hasInteracted),
					tap(async () => {
						await waitTime(50);
						await this.previewAudio
							?.play()
							.catch((e) => this.logger.log(LogLevel.error, e));
						this.prepAudioProgress();
					}),
					retry(1),
					takeUntil(this.destroyedS)
				)
				.subscribe();
		}
	}

	private prepAudioProgress() {
		const durationS = this.previewAudio?.duration;
		if (!durationS) {
			return;
		}

		const intervalToSecondRatio = 1;
		const intervalMs = 1000 * intervalToSecondRatio;

		interval(intervalMs)
			.pipe(
				map((intervals) => {
					const seconds = (intervals + 1) * intervalToSecondRatio;
					return (seconds / durationS) % 1;
				}),
				runInZone(this.zone),
				tap((progress) => this.progressS.next(progress)),
				takeUntil(this.destroyedS)
			)
			.subscribe();
	}

	private prepTransition() {
		const duration = this.transitionDurationMs;
		if (!duration) {
			return;
		}

		requestAnimationFrame(() => {
			if (this.isFirst) {
				requestAnimationFrame(() => {
					this.renderer.setStyle(
						this.self.nativeElement,
						'transition-duration',
						duration
					);

					setTimeout(() => {
						requestAnimationFrame(() => {
							this.renderer.removeStyle(
								this.self.nativeElement,
								'transition-duration'
							);
						});
					}, parseInt(duration, 10));
				});
			} else {
				this.renderer.setStyle(this.self.nativeElement, 'transition-duration', duration);
			}
		});
	}
}
