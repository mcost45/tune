import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { HttpClientModule } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { TranslateModule } from '@ngx-translate/core';
import { MatIconModule } from '@angular/material/icon';
import { HeaderComponent } from './components/header/header.component';
import { CssUrlPipe } from './pipes/css-url.pipe';
import { ProfileButtonComponent } from './components/profile-button/profile-button.component';
import { ProfileMenuComponent } from './components/profile-menu/profile-menu.component';
import { CommaJoinPipe } from './pipes/comma-join.pipe';
import { BackgroundUrlCssPipe } from './pipes/background-url-css.pipe';
import { SanitizeResourceUrlPipe } from './pipes/sanitize-resource-url.pipe';
import { ImageColourElementPipe } from './pipes/image-colour-element.pipe';
import { ImageColourUrlPipe } from './pipes/image-colour-url.pipe';
import { BackgroundCssPipe } from './pipes/background-css.pipe';
import { BackgroundFadeCssPipe } from './pipes/background-fade-css.pipe';
import { TruncateStringPipe } from './pipes/truncate-string.pipe';
import { FooterComponent } from './components/footer/footer.component';

@NgModule({
	imports: [
		CommonModule,
		RouterModule,
		HttpClientModule,
		FormsModule,
		IonicModule,
		TranslateModule,
		MatIconModule
	],
	exports: [
		CommonModule,
		RouterModule,
		HttpClientModule,
		FormsModule,
		IonicModule,
		TranslateModule,
		MatIconModule,
		HeaderComponent,
		FooterComponent,
		CommaJoinPipe,
		BackgroundUrlCssPipe,
		BackgroundCssPipe,
		BackgroundFadeCssPipe,
		SanitizeResourceUrlPipe,
		ImageColourUrlPipe,
		ImageColourElementPipe,
		TruncateStringPipe
	],
	declarations: [
		HeaderComponent,
		FooterComponent,
		CssUrlPipe,
		ProfileButtonComponent,
		ProfileMenuComponent,
		CommaJoinPipe,
		BackgroundUrlCssPipe,
		BackgroundCssPipe,
		BackgroundFadeCssPipe,
		SanitizeResourceUrlPipe,
		ImageColourUrlPipe,
		ImageColourElementPipe,
		TruncateStringPipe
	]
})
export class SharedModule {}
