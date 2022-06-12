import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { HttpClientModule } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { TranslateModule } from '@ngx-translate/core';
import { HeaderComponent } from './components/header/header.component';
import { CssUrlPipe } from './pipes/css-url.pipe';
import { ProfileButtonComponent } from './components/profile-button/profile-button.component';
import { ProfileMenuComponent } from './components/profile-menu/profile-menu.component';

@NgModule({
	imports: [
		CommonModule,
		RouterModule,
		HttpClientModule,
		FormsModule,
		IonicModule,
		TranslateModule
	],
	exports: [
		CommonModule,
		RouterModule,
		HttpClientModule,
		FormsModule,
		IonicModule,
		TranslateModule,
		HeaderComponent
	],
	declarations: [HeaderComponent, CssUrlPipe, ProfileButtonComponent, ProfileMenuComponent]
})
export class SharedModule {}
