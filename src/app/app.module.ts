import { APP_INITIALIZER, ErrorHandler, NgModule } from '@angular/core';
import { RouteReuseStrategy } from '@angular/router';

import { IonicModule, IonicRouteStrategy } from '@ionic/angular';
import { IonicStorageModule } from '@ionic/storage-angular';
import { TranslateLoader, TranslateModule, TranslateService } from '@ngx-translate/core';
import { HttpClient } from '@angular/common/http';
import { TranslateHttpLoader } from '@ngx-translate/http-loader';
import { ServiceWorkerModule } from '@angular/service-worker';
import { BrowserModule } from '@angular/platform-browser';
import { environment } from '../environments/environment';
import { CoreModule } from './core/core.module';
import { SharedModule } from './shared/shared.module';
import { AppRoutingModule } from './routing/app-routing.module';
import { AppComponent } from './app.component';
import { LogService } from './shared/services/utility/log.service';

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
		IonicModule.forRoot({
			mode: 'md'
		}),
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
		AppRoutingModule,
		ServiceWorkerModule.register('./ngsw-worker.js', {
			enabled: environment.production,
			registrationStrategy: 'registerWhenStable:10000'
		})
	],
	providers: [
		{
			provide: APP_INITIALIZER,
			useFactory: appFactory,
			deps: [TranslateService],
			multi: true
		},
		{
			provide: RouteReuseStrategy,
			useClass: IonicRouteStrategy
		},
		{ provide: ErrorHandler, useClass: LogService }
	],
	bootstrap: [AppComponent]
})
export class AppModule {}
