import { APP_INITIALIZER, NgModule, Optional, SkipSelf } from '@angular/core';
import { Storage } from '@ionic/storage-angular';
import { ConfigService } from './services/utility/config.service';
import { LogService } from './services/utility/log.service';
import { AuthStorageService } from './services/authentication/auth-storage.service';
import { UserService } from './services/user.service';

const coreFactory =
	(
		configService: ConfigService,
		logService: LogService,
		storage: Storage,
		authStorageService: AuthStorageService,
		userService: UserService
	) =>
	() =>
		new Promise<void>((resolve) => {
			configService.loadConfig().subscribe(async () => {
				logService.init();
				await storage.create();
				await userService.init();

				resolve();
			});
		});

@NgModule({
	providers: [
		{
			provide: APP_INITIALIZER,
			useFactory: coreFactory,
			deps: [ConfigService, LogService, Storage, AuthStorageService, UserService],
			multi: true
		}
	]
})
export class CoreModule {
	private static coreModuleAlreadyLoaded =
		'CoreModule is already loaded. It should only be imported in AppModule.';

	constructor(@Optional() @SkipSelf() parentModule: CoreModule) {
		if (parentModule) {
			throw new Error(CoreModule.coreModuleAlreadyLoaded);
		}
	}
}
