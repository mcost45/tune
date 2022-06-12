import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { SharedModule } from '../../../../shared/shared.module';
import { NotFoundPageRoutingModule } from './not-found-routing.module';

import { NotFoundPage } from './not-found.page';

@NgModule({
	imports: [CommonModule, FormsModule, IonicModule, NotFoundPageRoutingModule, SharedModule],
	declarations: [NotFoundPage]
})
export class NotFoundPageModule {}
