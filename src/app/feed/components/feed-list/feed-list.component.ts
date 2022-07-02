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
import { InteractedService } from '../../../shared/services/interacted.service';
import 'hammerjs';
import { ConfigService } from '../../../shared/services/utility/config.service';
import { AudioService } from '../../services/audio.service';
import { AppTitleStrategyService } from '../../../routing/app-title-strategy.service';
import { waitFrame } from '../../../utility/wait-frame';
import { waitTime } from '../../../utility/wait-time';

@Component({
	selector: 'app-feed-list',
	templateUrl: './feed-list.component.html',
	styleUrls: ['./feed-list.component.scss'],
	changeDetection: ChangeDetectionStrategy.OnPush,
	providers: [FeedSeedService, FeedService, AudioService]
})
export class FeedListComponent implements OnInit, OnDestroy {
	private static readonly maxActiveLen = 5;
	private static readonly fetchBelowLen = Math.ceil(FeedListComponent.maxActiveLen * 0.75);
	private static readonly fetchLen = Math.ceil(FeedListComponent.maxActiveLen * 2.5);
	private static readonly minSwipeVelocity = 0.2;
	private static readonly swipedNewDelayMs = 100;
	private static readonly moveTransitionDurationMs = '80ms';
	private static readonly hoverTransitionDurationMs = '50ms';
	private static readonly maxTitleCharLen = 28;
	private static readonly overlayFadeStrengthPercentage = 60;

	@ViewChildren(FeedCardComponent, { read: ElementRef }) cardElements?: QueryList<
		ElementRef<HTMLElement>
	>;

	activeCards$!: Observable<RecommendedCard[]>;
	hasInteracted$!: Observable<boolean>;

	transitionDurationMs = FeedListComponent.moveTransitionDurationMs;
	maxTitleCharLen = FeedListComponent.maxTitleCharLen;
	overlayFadeStrengthPercentage = FeedListComponent.overlayFadeStrengthPercentage;

	private readonly activeCardsS = new BehaviorSubject<RecommendedCard[]>([]);
	private readonly cardQueueS = new BehaviorSubject<RecommendedCard[]>([]);
	private readonly destroyedS = new ReplaySubject<boolean>(1);

	private readonly onHoverBound = this.onHover.bind(this);
	private readonly onVisibilityChangeBound = this.onVisibilityChange.bind(this);

	private audio?: HTMLAudioElement;
	private hammer?: HammerManager;

	private hasSwiped = false;
	private isDragging = false;
	private isResetting = false;
	private isHovering = false;

	constructor(
		private readonly configService: ConfigService,
		private readonly logger: LogService,
		private readonly feedService: FeedService,
		private readonly interactedService: InteractedService,
		readonly audioService: AudioService,
		private readonly appTitleStrategyService: AppTitleStrategyService,
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
		this.feedService.init();
	}

	ngOnDestroy() {
		this.removeZoneExternalEventListeners();
		this.cleanUpObservables();
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
			this.observeRecommendedCards();
			this.observeCardQueue();
		});
	}

	private observeRecommendedCards() {
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
					const newTrack = newQueuedCards[0]?.track;

					this.onNewAudio(newTrack);
					this.activeCardsS.next(newQueuedCards.slice(0, FeedListComponent.maxActiveLen));
					newQueuedCards = newQueuedCards.slice(FeedListComponent.maxActiveLen);
				}

				this.cardQueueS.next(newQueuedCards);
			});
	}

	private observeCardQueue() {
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
	}

	private cleanUpObservables() {
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

	private async applyHover(
		card: HTMLElement,
		horizontal: number,
		vertical: number,
		clientWidth: number
	) {
		await waitFrame();

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
	}

	private onPanStart(event: HammerInput) {
		const card = this.getTopCardEl();
		if (!card || this.hasSwiped) {
			return;
		}

		this.isHovering = false;
		this.isDragging = true;

		this.applyPanStart(card);
	}

	private async applyPanStart(card: HTMLElement) {
		await waitFrame();

		this.renderer.removeStyle(card, 'transition-duration');
	}

	private onPan(event: HammerInput) {
		const card = this.getTopCardEl();
		if (!card || !this.isDragging) {
			return;
		}

		this.applyPan(card, event);
	}

	private async applyPan(card: HTMLElement, event: HammerInput) {
		await waitFrame();

		const { deltaX, deltaY } = event;
		const withoutTranslate = this.getCardTransformExcludingTranslation(card);
		const cardTransform = `${withoutTranslate} translate(${deltaX}px, ${deltaY}px)`;

		this.renderer.setStyle(card, 'transform', cardTransform);
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

	private async applyPanEndInitial(
		card: HTMLElement,
		aboveThreshold: boolean,
		wasLike: boolean,
		activeCards: RecommendedCard[],
		queuedCards: RecommendedCard[]
	) {
		await waitFrame();

		const maxActiveLen = FeedListComponent.maxActiveLen;
		const duration = FeedListComponent.moveTransitionDurationMs;
		const withoutTranslate = this.getCardTransformExcludingTranslation(card, true);

		let translateX: string;
		if (aboveThreshold) {
			translateX = wasLike ? '320%' : '-320%';
			this.isResetting = false;
		} else {
			translateX = '0px';
			this.isResetting = true;
		}

		const cardTransform = `${withoutTranslate} translate(${translateX}, 0px)`;

		this.isDragging = false;

		this.renderer.setStyle(card, 'transition-duration', duration);
		this.renderer.setStyle(card, 'transform', cardTransform);

		await waitTime(parseInt(duration, 10) + FeedListComponent.swipedNewDelayMs);

		if (aboveThreshold) {
			const newActiveCards = activeCards.slice(1);
			const newQueuedCards = queuedCards.slice(1);
			const newActiveCardsLen = newActiveCards.length;
			const newQueuedCardsLen = newQueuedCards.length;

			if (newQueuedCardsLen > 0) {
				const pushAmount = maxActiveLen - newActiveCardsLen;
				const pushActiveCards = newQueuedCards?.slice(0, pushAmount);

				if (pushActiveCards) {
					newActiveCards.push(...pushActiveCards);
				}
			}

			const newTrack = newActiveCards[0]?.track;

			this.onNewAudio(newTrack);
			this.cardQueueS.next(newQueuedCards);

			this.zone.run(() => {
				this.activeCardsS.next(newActiveCards);
			});
		}

		this.applyPanEndCompleted(card);
	}

	private async applyPanEndCompleted(card: HTMLElement) {
		await waitFrame();

		this.hasSwiped = false;
		this.isResetting = false;

		this.renderer.setStyle(
			card,
			'transform',
			this.getCardTransformExcludingTranslation(card, true)
		);
		this.renderer.removeStyle(card, 'transition-duration');
	}

	private onNewAudio(track?: SpotifyApi.TrackObjectFull) {
		if (track) {
			this.audioService.setSource(track.preview_url);
			this.appTitleStrategyService.modifySubTitle(`${track.name}`, false, false);
		}
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
			element.addEventListener('mousemove', this.onHoverBound);
			element.addEventListener('touchstart', this.onHoverBound);
			this.hammer?.on('panstart', this.onPanStart.bind(this));
			this.hammer?.on('pan', this.onPan.bind(this));
			this.hammer?.on('panend pancancel', this.onPanEnd.bind(this));
			document.addEventListener('visibilitychange', this.onVisibilityChangeBound);
		});
	}

	private removeZoneExternalEventListeners() {
		const element = this.self.nativeElement;
		element.removeEventListener('mousemove', this.onHover);
		element.removeEventListener('touchstart', this.onHover);
		this.hammer?.destroy();
		document.removeEventListener('visibilitychange', this.onVisibilityChangeBound);
	}

	private getTopCardEl(): HTMLElement | undefined {
		const cards = this.cardElements;
		if (!cards) {
			return;
		}

		const len = cards.length;
		if (len > 0) {
			return cards.get(len - 1)?.nativeElement;
		}
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
