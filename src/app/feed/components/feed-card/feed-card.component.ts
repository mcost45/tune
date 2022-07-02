import { ChangeDetectionStrategy, Component, HostBinding, Input } from '@angular/core';
import { Observable } from 'rxjs';
import { RecommendedCard } from '../../domain/recommended-card';

@Component({
	selector: 'app-feed-card',
	templateUrl: './feed-card.component.html',
	styleUrls: ['./feed-card.component.scss'],
	changeDetection: ChangeDetectionStrategy.OnPush
})
export class FeedCardComponent {
	@Input() recommendation?: RecommendedCard;
	@Input() audioDuration?: number;
	@Input() audioProgress$?: Observable<number>;
	@Input() maxTitleCharLen?: number;
	@Input() overlayFadeStrengthPercentage?: number;
	@Input() isFirst = false;

	@HostBinding('style.transition-duration')
	@Input()
	transitionDurationMs?: string;
}
