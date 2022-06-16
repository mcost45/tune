import { ChangeDetectionStrategy, Component, OnInit } from '@angular/core';
import { FeedService } from '../../services/feed.service';

@Component({
	selector: 'app-feed-list',
	templateUrl: './feed-list.component.html',
	styleUrls: ['./feed-list.component.scss'],
	changeDetection: ChangeDetectionStrategy.OnPush,
	providers: [FeedService]
})
export class FeedListComponent implements OnInit {
	private static readonly elementCount = 6;

	activeCards = [];

	private readonly cardQueue = [];

	constructor(private readonly feedService: FeedService) {}

	ngOnInit() {
		this.feedService.init();
	}

	private populateQueue() {
		//
	}
}
