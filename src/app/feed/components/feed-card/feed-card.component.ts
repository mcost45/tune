import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
	selector: 'app-feed-card',
	templateUrl: './feed-card.component.html',
	styleUrls: ['./feed-card.component.scss'],
	changeDetection: ChangeDetectionStrategy.OnPush
})
export class FeedCardComponent {
	constructor() {}
}
