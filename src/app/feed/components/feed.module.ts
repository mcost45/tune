import { NgModule } from '@angular/core';
import { SharedModule } from '../../shared/shared.module';
import { FeedCardComponent } from './feed-card/feed-card.component';
import { FeedListComponent } from './feed-list/feed-list.component';

@NgModule({
	imports: [SharedModule],
	declarations: [FeedListComponent, FeedCardComponent],
	exports: [FeedListComponent]
})
export class FeedModule {}
