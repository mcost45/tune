import {
	ChangeDetectionStrategy,
	Component,
	ElementRef,
	NgZone,
	OnDestroy,
	OnInit,
	QueryList,
	Renderer2,
	ViewChildren
} from '@angular/core';
import {
	BehaviorSubject,
	combineLatest,
	filter,
	map,
	Observable,
	ReplaySubject,
	take,
	takeUntil,
	withLatestFrom
} from 'rxjs';
import { FeedService } from '../../services/feed.service';
import { FeedSeedService } from '../../services/feed-seed.service';
import { LogService } from '../../../shared/services/utility/log.service';
import { LogLevel } from '../../../shared/domain/utility/log-level';
import { runInZone } from '../../../utility/run-in-zone';
import { RecommendedCard } from '../../domain/recommended-card';
import { FeedCardComponent } from '../feed-card/feed-card.component';
import 'hammerjs';

@Component({
	selector: 'app-feed-list',
	templateUrl: './feed-list.component.html',
	styleUrls: ['./feed-list.component.scss'],
	changeDetection: ChangeDetectionStrategy.OnPush,
	providers: [FeedSeedService, FeedService]
})
export class FeedListComponent implements OnInit, OnDestroy {
	private static readonly maxActiveLen = 10;
	private static readonly minSwipeVelocity = 1.25;
	private static readonly swipedNewDelayMs = 100;
	private static readonly transitionDurationMs = '200ms';

	@ViewChildren(FeedCardComponent, { read: ElementRef }) cardElements?: QueryList<
		ElementRef<HTMLElement>
	>;

	activeCards$: Observable<RecommendedCard[]>;
	transitionDurationMs = FeedListComponent.transitionDurationMs;

	private readonly activeCardsS = new BehaviorSubject<RecommendedCard[]>([]);
	private readonly destroyedS = new ReplaySubject(1);

	private cardQueue: RecommendedCard[] = [];
	private hammer?: HammerManager;
	private isDragging = false;
	private hasSwiped = false;

	constructor(
		private readonly logger: LogService,
		private readonly feedService: FeedService,
		private readonly zone: NgZone,
		private readonly renderer: Renderer2,
		private readonly self: ElementRef
	) {
		this.activeCards$ = this.activeCardsS.asObservable();
	}

	ngOnInit() {
		this.prepareHammer();
		this.addZoneExternalEventListeners();
		this.setupObservables();
	}

	ngOnDestroy() {
		this.removeZoneExternalEventListeners();

		this.destroyedS.next(true);
		this.destroyedS.complete();
	}

	trackById(index: number, item: RecommendedCard): string {
		return item.track.id;
	}

	private setupObservables(): void {
		this.zone.runOutsideAngular(() => {
			this.feedService.recommendedCards$
				.pipe(
					withLatestFrom(this.activeCardsS),
					runInZone(this.zone),
					takeUntil(this.destroyedS)
				)
				.subscribe(([newCards, activeCards]) => {
					this.cardQueue.push(...newCards);

					const maxActiveLen = FeedListComponent.maxActiveLen;
					console.log(activeCards);
					if (activeCards.length < maxActiveLen) {
						this.activeCardsS.next(
							[...activeCards, ...newCards].slice(0, maxActiveLen)
						);
					}
				});

			const isInitiated$ = this.feedService.isInitiated$.pipe(
				filter((initiated) => initiated),
				take(1)
			);

			combineLatest([this.activeCardsS, isInitiated$])
				.pipe(
					map(([cards]) => cards.length),
					filter((cardLen) => cardLen < 3),
					takeUntil(this.destroyedS)
				)
				.subscribe((activeCardLen) => {
					this.feedService.triggerRecommendations();
				});

			this.feedService.init();
		});
	}

	private onHover(event: MouseEvent | TouchEvent) {
		const card = this.getTopCardEl();
		if (!card || this.isDragging || this.hasSwiped) {
			return;
		}

		const { clientWidth, clientHeight, offsetLeft, offsetTop } = card;

		let posX: number;
		let posY: number;
		if (event.type === 'touchmove') {
			const touch = (event as TouchEvent).touches[0];
			posX = touch.clientX;
			posY = touch.clientY;
		} else {
			posX = (event as MouseEvent).clientX;
			posY = (event as MouseEvent).clientY;
		}

		requestAnimationFrame(() => {
			const horizontal = (posX - offsetLeft) / clientWidth;
			const vertical = (posY - offsetTop) / clientHeight;

			const threshold = 8;
			const rotateX = threshold / 2 - horizontal * threshold;
			const rotateY = vertical * threshold - threshold / 2;

			const cardTransform = `perspective(${clientWidth}px) rotateX(${rotateY}deg) rotateY(${rotateX}deg)`;
			this.renderer.setStyle(card, 'transform', cardTransform);
		});
	}

	private onPanStart(event: HammerInput) {
		const card = this.getTopCardEl();
		if (!card || this.hasSwiped) {
			return;
		}

		this.isDragging = true;

		requestAnimationFrame(() => {
			this.renderer.removeStyle(card, 'transition-duration');
		});
	}

	private onPan(event: HammerInput) {
		const card = this.getTopCardEl();
		if (!card || !this.isDragging) {
			return;
		}

		requestAnimationFrame(() => {
			const { deltaX, deltaY } = event;
			const withoutTranslate = this.getCardTransformExcludingTranslation(card);
			const cardTransform = `${withoutTranslate} translate(${deltaX}px, ${deltaY}px)`;

			this.renderer.setStyle(card, 'transform', cardTransform);
		});
	}

	private onPanEnd(event: HammerInput) {
		const card = this.getTopCardEl();
		if (!card || !this.isDragging) {
			return;
		}

		const velocityX = event.velocityX;
		const absVelocityX = Math.abs(velocityX);
		const aboveThreshold = absVelocityX > FeedListComponent.minSwipeVelocity;
		const wasLike = velocityX > 0;

		this.activeCards$.pipe(take(1), takeUntil(this.destroyedS)).subscribe((activeCards) => {
			if (aboveThreshold) {
				this.hasSwiped = true;

				const track = activeCards[0].track;
				if (track) {
					if (wasLike) {
						this.onLikeTrack(track);
					} else {
						this.onDislikeTrack(track);
					}
				}
			}

			requestAnimationFrame(() => {
				const duration = FeedListComponent.transitionDurationMs;
				const withoutTranslate = this.getCardTransformExcludingTranslation(card, true);

				let translateX: string;
				if (aboveThreshold) {
					translateX = wasLike ? '200%' : '-200%';
				} else {
					translateX = '0px';
				}

				const cardTransform = `${withoutTranslate} translate(${translateX}, 0px)`;

				this.renderer.setStyle(card, 'transition-duration', duration);
				this.renderer.setStyle(card, 'transform', cardTransform);

				setTimeout(() => {
					if (aboveThreshold) {
						console.log([...activeCards]);
						const [_, ...shiftedCards] = activeCards;
						console.log(_, [...activeCards]);
						this.zone.run(() => {
							this.activeCardsS.next(shiftedCards);
						});
					}

					requestAnimationFrame(() => {
						this.renderer.setStyle(
							card,
							'transform',
							this.getCardTransformExcludingTranslation(card, true)
						);
						this.renderer.removeStyle(card, 'transition-duration');
						this.isDragging = false;
						this.hasSwiped = false;
					});
				}, parseInt(duration, 10) + FeedListComponent.swipedNewDelayMs);
			});
		});
	}

	private onLikeTrack(track: SpotifyApi.TrackObjectSimplified): Promise<[void, void]> {
		this.logger.log(LogLevel.trace, `Liked track '${track.name}'`);
		return this.feedService.likeTrack(track);
	}

	private onDislikeTrack(track: SpotifyApi.TrackObjectSimplified) {
		this.logger.log(LogLevel.trace, `Disliked track '${track.name}'`);
	}

	private prepareHammer(): void {
		this.zone.runOutsideAngular(() => {
			this.hammer = new Hammer.Manager(this.self.nativeElement, {
				recognizers: [[Hammer.Pan]]
			});
		});
	}

	private addZoneExternalEventListeners(): void {
		this.zone.runOutsideAngular(() => {
			const element = this.self.nativeElement;
			element.addEventListener('mousemove', this.onHover.bind(this));
			element.addEventListener('touchstart', this.onHover.bind(this));
			this.hammer?.on('panstart', this.onPanStart.bind(this));
			this.hammer?.on('pan', this.onPan.bind(this));
			this.hammer?.on('panend pancancel', this.onPanEnd.bind(this));
		});
	}

	private removeZoneExternalEventListeners(): void {
		const element = this.self.nativeElement;
		element.removeEventListener('mousemove', this.onHover);
		element.removeEventListener('touchstart', this.onHover);
		this.hammer?.destroy();
	}

	private getTopCardEl(): HTMLElement | undefined {
		return this.cardElements?.get(0)?.nativeElement;
	}

	private getCardTransformExcludingTranslation(card: HTMLElement, resetRotation = false): string {
		const prevTransform = card.style.transform;
		const values = prevTransform.split(' ');

		if (resetRotation) {
			values[1] = 'rotateX(0deg)';
			values[2] = 'rotateY(0deg)';
		}

		return values.slice(0, 3).join(' ');
	}
}
