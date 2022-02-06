import { APP_INITIALIZER, NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { RouteReuseStrategy } from '@angular/router';

import { IonicModule, IonicRouteStrategy } from '@ionic/angular';
import { IonicStorageModule } from '@ionic/storage-angular';
import { AppComponent } from './app.component';
import { AppRoutingModule } from './routing/app-routing.module';
import { SharedModule } from './shared/shared.module';
import { CoreModule } from './core/core.module';
import { TranslateLoader, TranslateModule, TranslateService } from '@ngx-translate/core';
import { HttpClient } from '@angular/common/http';
import { TranslateHttpLoader } from '@ngx-translate/http-loader';

const ii8nDefaultLanguage = 'en';
const ii8nLoadPrefix = './assets/ii8n/';
const ii8nLoadSuffix = '.json';

export const httpLoaderFactory = (http: HttpClient) => {
	return new TranslateHttpLoader(http, ii8nLoadPrefix, ii8nLoadSuffix);
};

const appFactory = (translateService: TranslateService) => {
	return () =>
		new Promise<void>((resolve) => {
			translateService.setDefaultLang(ii8nDefaultLanguage);
			translateService.use(ii8nDefaultLanguage);

			resolve();
		});
};

@NgModule({
	declarations: [AppComponent],
	imports: [
		IonicModule.forRoot(),
		IonicStorageModule.forRoot(),
		TranslateModule.forRoot({
			loader: {
				provide: TranslateLoader,
				useFactory: httpLoaderFactory,
				deps: [HttpClient]
			},
			defaultLanguage: ii8nDefaultLanguage
		}),
		CoreModule,
		SharedModule,
		BrowserModule,
		AppRoutingModule
	],
	providers: [
		{
			provide: RouteReuseStrategy,
			useClass: IonicRouteStrategy
		},
		{
			provide: APP_INITIALIZER,
			useFactory: appFactory,
			deps: [TranslateService],
			multi: true
		}
	],
	bootstrap: [AppComponent]
})
export class AppModule {}
