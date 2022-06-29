import {
	ChangeDetectionStrategy,
	Component,
	ElementRef,
	Input,
	NgZone,
	OnChanges,
	OnDestroy,
	Renderer2,
	SimpleChanges
} from '@angular/core';
import { BehaviorSubject, Observable, ReplaySubject } from 'rxjs';
import { RecommendedCard } from '../../domain/recommended-card';

@Component({
	selector: 'app-feed-card',
	templateUrl: './feed-card.component.html',
	styleUrls: ['./feed-card.component.scss'],
	changeDetection: ChangeDetectionStrategy.OnPush
})
export class FeedCardComponent implements OnChanges, OnDestroy {
	@Input() recommendation?: RecommendedCard;
	@Input() audioDuration?: number;
	@Input() audioProgress$?: Observable<number>;
	@Input() transitionDurationMs?: string;
	@Input() maxTitleCharLen?: number;
	@Input() overlayFadeStrengthPercentage?: number;
	@Input() isFirst = false;
	@Input() isSecond = false;

	private readonly destroyedS = new ReplaySubject(1);
	private readonly progressS = new BehaviorSubject(0);

	private readonly progress$ = this.progressS.asObservable();

	constructor(
		private readonly zone: NgZone,
		private readonly renderer: Renderer2,
		private readonly self: ElementRef
	) {}

	ngOnChanges(changes: SimpleChanges) {
		const { isFirst, isSecond } = changes;
		if (isFirst || isSecond) {
			this.prepareCard();
		}
	}

	ngOnDestroy() {
		this.destroyedS.next(true);
		this.destroyedS.complete();
	}

	private prepareCard() {
		const { isFirst, isSecond } = this;

		if (isFirst || isSecond) {
			this.zone.runOutsideAngular(() => {
				const duration = this.transitionDurationMs;
				if (!duration) {
					return;
				}

				const el = this.self.nativeElement;
				const style = 'transition-duration';

				if (isFirst) {
					requestAnimationFrame(() => {
						this.renderer.setStyle(el, style, duration);

						setTimeout(() => {
							requestAnimationFrame(() => {
								this.renderer.removeStyle(el, style);
							});
						}, parseInt(duration + 50, 10));
					});
				} else {
					this.renderer.setStyle(el, style, duration);
				}
			});
		}
	}
}
