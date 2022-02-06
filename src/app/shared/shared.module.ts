import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { HttpClientModule } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { TranslateModule } from '@ngx-translate/core';
import { HeaderComponent } from './components/header/header.component';

@NgModule({
	imports: [CommonModule, RouterModule, HttpClientModule, FormsModule, IonicModule],
	exports: [
		CommonModule,
		RouterModule,
		HttpClientModule,
		FormsModule,
		IonicModule,
		TranslateModule,
		HeaderComponent
	],
	declarations: [HeaderComponent]
})
export class SharedModule {}
