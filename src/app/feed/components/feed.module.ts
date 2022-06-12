import { NgModule } from '@angular/core';
import { SharedModule } from '../../shared/shared.module';
import { ListComponent } from './list/list.component';
import { CardComponent } from './card/card.component';

@NgModule({
	imports: [SharedModule],
	declarations: [ListComponent, CardComponent],
	exports: [ListComponent, CardComponent]
})
export class FeedModule {}
