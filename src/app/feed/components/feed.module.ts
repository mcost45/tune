import { NgModule } from '@angular/core';
import { SharedModule } from '../../shared/shared.module';
import { FeedCardComponent } from './feed-card/feed-card.component';
import { FeedListComponent } from './feed-list/feed-list.component';
import { ArtistNamesPipe } from './pipes/artist-names.pipe';
import { ArtistImagePipe } from './pipes/artist-image.pipe';
import { CardOffsetPipe } from './pipes/card-offset.pipe';
import { TrackImagePipe } from './pipes/track-image.pipe';
import { PopularityCategoryPipe } from './pipes/popularity-category.pipe';
import { DanceabilityCategoryPipe } from './pipes/danceability-category.pipe';
import { EnergyCategoryPipe } from './pipes/energy-category.pipe';
import { LoudnessCategoryPipe } from './pipes/loudness-category.pipe';
import { AcousticnessCategoryPipe } from './pipes/acousticness-category.pipe';

@NgModule({
	imports: [SharedModule],
	declarations: [
		FeedListComponent,
		FeedCardComponent,
		ArtistNamesPipe,
		ArtistImagePipe,
		CardOffsetPipe,
		TrackImagePipe,
		PopularityCategoryPipe,
		DanceabilityCategoryPipe,
		EnergyCategoryPipe,
		LoudnessCategoryPipe,
		AcousticnessCategoryPipe
	],
	exports: [FeedListComponent]
})
export class FeedModule {}
