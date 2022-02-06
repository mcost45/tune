import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
	selector: 'app-feed',
	templateUrl: './feed.page.html',
	styleUrls: ['./feed.page.scss'],
	changeDetection: ChangeDetectionStrategy.OnPush
})
export class FeedPage {}
