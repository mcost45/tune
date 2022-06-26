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
import { tap } from 'rxjs/operators';
import { FeedService } from '../../services/feed.service';
import { FeedSeedService } from '../../services/feed-seed.service';
import { LogService } from '../../../shared/services/utility/log.service';
import { LogLevel } from '../../../shared/domain/utility/log-level';
import { runInZone } from '../../../utility/run-in-zone';
import { RecommendedCard } from '../../domain/recommended-card';
import { FeedCardComponent } from '../feed-card/feed-card.component';
import 'hammerjs';
import { HapticService } from '../../../shared/services/haptic.service';
import { InteractedService } from '../../../shared/services/interacted.service';

@Component({
	selector: 'app-feed-list',
	templateUrl: './feed-list.component.html',
	styleUrls: ['./feed-list.component.scss'],
	changeDetection: ChangeDetectionStrategy.OnPush,
	providers: [FeedSeedService, FeedService]
})
export class FeedListComponent implements OnInit, OnDestroy {
	private static readonly maxActiveLen = 10;
	private static readonly fetchBelowLen = Math.ceil(FeedListComponent.maxActiveLen * 0.75);
	private static readonly fetchLen = Math.ceil(FeedListComponent.maxActiveLen * 2.5);
	private static readonly minSwipeVelocity = 1.5;
	private static readonly swipedNewDelayMs = 100;
	private static readonly minDragOpacity = 0.3;
	private static readonly moveTransitionDurationMs = '100ms';
	private static readonly hoverTransitionDurationMs = '50ms';

	@ViewChildren(FeedCardComponent, { read: ElementRef }) cardElements?: QueryList<
		ElementRef<HTMLElement>
	>;

	activeCards$!: Observable<RecommendedCard[]>;
	hasInteracted$!: Observable<boolean>;

	transitionDurationMs = FeedListComponent.moveTransitionDurationMs;

	private readonly activeCardsS = new BehaviorSubject<RecommendedCard[]>([]);
	private readonly cardQueueS = new BehaviorSubject<RecommendedCard[]>([]);
	private readonly destroyedS = new ReplaySubject(1);

	private hammer?: HammerManager;

	private hasSwiped = false;
	private isDragging = false;
	private isResetting = false;
	private isHovering = false;

	constructor(
		private readonly logger: LogService,
		private readonly feedService: FeedService,
		private readonly hapticService: HapticService,
		private readonly interactedService: InteractedService,
		private readonly zone: NgZone,
		private readonly renderer: Renderer2,
		private readonly self: ElementRef
	) {
		this.setupVars();
	}

	ngOnInit() {
		this.prepareHammer();
		this.addZoneExternalEventListeners();
		this.setupObservables();
	}

	ngOnDestroy() {
		this.removeZoneExternalEventListeners();
		this.cleanObservables();
	}

	trackById(index: number, item: RecommendedCard): string {
		return item.track.id;
	}

	private setupVars() {
		this.hasInteracted$ = this.interactedService.hasInteracted$;
		this.activeCards$ = this.activeCardsS.asObservable();
		this.feedService.setFetchAmount(FeedListComponent.fetchLen);
	}

	private setupObservables() {
		this.zone.runOutsideAngular(() => {
			this.feedService.recommendedCards$
				.pipe(
					withLatestFrom(this.activeCardsS),
					withLatestFrom(this.cardQueueS),
					map(([[newCards, activeCards], queuedCards]) => [
						newCards,
						activeCards,
						queuedCards
					]),
					runInZone(this.zone),
					takeUntil(this.destroyedS)
				)
				.subscribe(([newCards, activeCards, queuedCards]) => {
					let newQueuedCards = [...queuedCards, ...newCards];

					if (!activeCards.length) {
						this.activeCardsS.next(
							newQueuedCards.slice(0, FeedListComponent.maxActiveLen)
						);
						newQueuedCards = newQueuedCards.slice(FeedListComponent.maxActiveLen);
					}

					this.cardQueueS.next(newQueuedCards);
				});

			const isInitiated$ = this.feedService.isInitiated$.pipe(
				filter((initiated) => initiated),
				take(1)
			);

			combineLatest([this.cardQueueS, isInitiated$])
				.pipe(
					map(([queuedCards]) => queuedCards.length),
					tap((queueLen) =>
						this.logger.log(LogLevel.trace, `${queueLen} tracks remaining in queue.`)
					),
					filter((queueLen) => queueLen < FeedListComponent.fetchBelowLen),
					takeUntil(this.destroyedS)
				)
				.subscribe(() => {
					this.feedService.triggerRecommendations();
				});

			this.feedService.init();
		});
	}

	private cleanObservables() {
		this.destroyedS.next(true);
		this.destroyedS.complete();
	}

	private onHover(event: MouseEvent | TouchEvent) {
		const card = this.getTopCardEl();

		if (!card || this.isDragging || this.hasSwiped || this.isResetting) {
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

		const horizontal = (posX - offsetLeft) / clientWidth;
		const vertical = (posY - offsetTop) / clientHeight;

		this.isHovering = true;

		this.applyHover(card, horizontal, vertical, clientWidth);
	}

	private applyHover(
		card: HTMLElement,
		horizontal: number,
		vertical: number,
		clientWidth: number
	) {
		requestAnimationFrame(() => {
			const threshold = 8;
			const rotateX = threshold / 2 - horizontal * threshold;
			const rotateY = vertical * threshold - threshold / 2;
			const cardTransform = `perspective(${clientWidth}px) rotateX(${rotateY}deg) rotateY(${rotateX}deg) rotateZ(0deg)`;

			this.renderer.setStyle(card, 'transform', cardTransform);
			this.renderer.setStyle(
				card,
				'transition-duration',
				FeedListComponent.hoverTransitionDurationMs
			);
		});
	}

	private onPanStart(event: HammerInput) {
		const card = this.getTopCardEl();
		if (!card || this.hasSwiped) {
			return;
		}

		this.isHovering = false;
		this.isDragging = true;

		this.hapticService.onSelectionStart();
		this.applyPanStart(card);
	}

	private applyPanStart(card: HTMLElement) {
		requestAnimationFrame(() => {
			this.renderer.removeStyle(card, 'transition-duration');
		});
	}

	private onPan(event: HammerInput) {
		const card = this.getTopCardEl();
		if (!card || !this.isDragging) {
			return;
		}

		this.applyPan(card, event);
	}

	private applyPan(card: HTMLElement, event: HammerInput) {
		requestAnimationFrame(() => {
			const { deltaX, deltaY, distance, direction } = event;
			const isPanningLeft = direction === Hammer.DIRECTION_LEFT;
			const negativeDeltaX = deltaX < 0;

			const withoutTranslate = this.getCardTransformExcludingTranslation(card);
			const cardTransform = `${withoutTranslate} translate(${deltaX}px, ${deltaY}px)`;
			const opacity =
				isPanningLeft && negativeDeltaX
					? Math.max((1 / distance) * 100, FeedListComponent.minDragOpacity)
					: 1;

			this.renderer.setStyle(card, 'transform', cardTransform);
			this.renderer.setStyle(card, 'opacity', opacity);
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

		this.activeCards$
			.pipe(take(1), withLatestFrom(this.cardQueueS), takeUntil(this.destroyedS))
			.subscribe(([activeCards, queuedCards]) => {
				if (aboveThreshold) {
					this.hasSwiped = true;

					this.hapticService.onSelectionEnd();

					const track = activeCards?.[0].track;
					if (track) {
						if (wasLike) {
							this.onLikeTrack(track);
						} else {
							this.onDislikeTrack(track);
						}
					}
				}

				this.applyPanEndInitial(card, aboveThreshold, wasLike, activeCards, queuedCards);
			});
	}

	private applyPanEndInitial(
		card: HTMLElement,
		aboveThreshold: boolean,
		wasLike: boolean,
		activeCards: RecommendedCard[],
		queuedCards: RecommendedCard[]
	) {
		requestAnimationFrame(() => {
			const duration = FeedListComponent.moveTransitionDurationMs;
			const withoutTranslate = this.getCardTransformExcludingTranslation(card, true);

			let translateX: string;
			if (aboveThreshold) {
				translateX = wasLike ? '300%' : '-300%';
				this.isResetting = false;
			} else {
				translateX = '0px';
				this.isResetting = true;
			}

			const cardTransform = `${withoutTranslate} translate(${translateX}, 0px)`;

			this.isDragging = false;

			this.renderer.setStyle(card, 'transition-duration', duration);
			this.renderer.setStyle(card, 'transform', cardTransform);
			if (this.isResetting) {
				this.renderer.setStyle(card, 'opacity', 1);
			}

			setTimeout(() => {
				if (aboveThreshold) {
					const newActiveCards = activeCards.slice(1);
					const newQueuedCards = queuedCards.slice(1);

					if (newQueuedCards.length > 1) {
						newActiveCards.push(newQueuedCards?.[0]);
					}

					this.zone.run(() => {
						this.cardQueueS.next(newQueuedCards);
						this.activeCardsS.next(newActiveCards);
					});
				}

				this.applyPanEndCompleted(card);
			}, parseInt(duration, 10) + FeedListComponent.swipedNewDelayMs);
		});
	}

	private applyPanEndCompleted(card: HTMLElement) {
		requestAnimationFrame(() => {
			this.hasSwiped = false;
			this.isResetting = false;

			this.renderer.setStyle(
				card,
				'transform',
				this.getCardTransformExcludingTranslation(card, true)
			);
			this.renderer.removeStyle(card, 'transition-duration');
		});
	}

	private onVisibilityChange() {
		if (document.visibilityState === 'hidden') {
			this.feedService.flushLikeBatch();
		}
	}

	private onLikeTrack(track: SpotifyApi.TrackObjectSimplified): Promise<[void, void, void]> {
		this.logger.log(LogLevel.trace, `Liked track '${track.name}.'`);
		return this.feedService.likeTrack(track);
	}

	private onDislikeTrack(track: SpotifyApi.TrackObjectSimplified): Promise<void> {
		this.logger.log(LogLevel.trace, `Disliked track '${track.name}.'`);
		return this.feedService.dislikeTrack(track);
	}

	private prepareHammer() {
		this.zone.runOutsideAngular(() => {
			this.hammer = new Hammer.Manager(this.self.nativeElement, {
				recognizers: [[Hammer.Pan]]
			});
		});
	}

	private addZoneExternalEventListeners() {
		this.zone.runOutsideAngular(() => {
			const element = this.self.nativeElement;
			element.addEventListener('mousemove', this.onHover.bind(this));
			element.addEventListener('touchstart', this.onHover.bind(this));
			this.hammer?.on('panstart', this.onPanStart.bind(this));
			this.hammer?.on('pan', this.onPan.bind(this));
			this.hammer?.on('panend pancancel', this.onPanEnd.bind(this));
			document.addEventListener('visibilitychange', this.onVisibilityChange.bind(this));
		});
	}

	private removeZoneExternalEventListeners() {
		const element = this.self.nativeElement;
		element.removeEventListener('mousemove', this.onHover);
		element.removeEventListener('touchstart', this.onHover);
		this.hammer?.destroy();
		document.removeEventListener('visibilitychange', this.onVisibilityChange);
	}

	private getTopCardEl(): HTMLElement | undefined {
		return this.cardElements?.get(0)?.nativeElement;
	}

	private getCardTransformExcludingTranslation(card: HTMLElement, resetRotation = false): string {
		const prevTransform = card.style.transform;
		const values = prevTransform.split(' ');

		if (resetRotation) {
			values[0] = 'perspective(none)';
			values[1] = 'rotateX(0deg)';
			values[2] = 'rotateY(0deg)';
			values[3] = 'rotateZ(0deg)';
		}

		return values.slice(0, 4).join(' ');
	}
}
