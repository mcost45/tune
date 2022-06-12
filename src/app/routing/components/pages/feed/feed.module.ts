import { NgModule } from '@angular/core';

import { SharedModule } from '../../../../shared/shared.module';
import { FeedModule } from '../../../../feed/components/feed.module';
import { FeedPageRoutingModule } from './feed-routing.module';

import { FeedPage } from './feed.page';

@NgModule({
	imports: [SharedModule, FeedModule, FeedPageRoutingModule],
	declarations: [FeedPage]
})
export class FeedPageModule {}
