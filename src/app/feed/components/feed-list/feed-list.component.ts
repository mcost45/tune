import { ChangeDetectionStrategy, Component } from '@angular/core';
import { FeedService } from '../../services/feed.service';
import { FeedStorageService } from '../../services/feed-storage.service';

@Component({
	selector: 'app-feed-list',
	templateUrl: './feed-list.component.html',
	styleUrls: ['./feed-list.component.scss'],
	changeDetection: ChangeDetectionStrategy.OnPush,
	providers: [FeedService, FeedStorageService]
})
export class FeedListComponent {
	private static readonly elementCount = 6;

	activeCards = [];

	private readonly cardQueue = [];

	constructor(private readonly feedService: FeedService) {}

	private populateQueue() {
		//
	}
}
