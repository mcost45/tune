import { ChangeDetectionStrategy, Component, Input } from '@angular/core';

@Component({
	selector: 'app-feed-card',
	templateUrl: './feed-card.component.html',
	styleUrls: ['./feed-card.component.scss'],
	changeDetection: ChangeDetectionStrategy.OnPush
})
export class FeedCardComponent {
	@Input() track?: SpotifyApi.TrackObjectSimplified;

	constructor() {}
}
