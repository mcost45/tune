import { NgModule } from '@angular/core';

import { FeedPageRoutingModule } from './feed-routing.module';

import { FeedPage } from './feed.page';
import { SharedModule } from '../../../../shared/shared.module';

@NgModule({
	imports: [SharedModule, FeedPageRoutingModule],
	declarations: [FeedPage]
})
export class FeedPageModule {}
