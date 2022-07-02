import { APP_INITIALIZER, NgModule, Optional, SkipSelf } from '@angular/core';
import { Storage } from '@ionic/storage-angular';
import { from, switchMap, tap } from 'rxjs';
import { ConfigService } from '../shared/services/utility/config.service';
import { LogService } from '../shared/services/utility/log.service';
import { InteractedService } from '../shared/services/interacted.service';
import { AuthStorageService } from './services/authentication/auth-storage.service';
import { UserService } from './services/user.service';

const coreFactory =
	(
		configService: ConfigService,
		logService: LogService,
		storage: Storage,
		authStorageService: AuthStorageService,
		userService: UserService,
		interactedService: InteractedService
	) =>
	() =>
		new Promise<void>((resolve) => {
			configService
				.loadConfig()
				.pipe(
					tap(() => logService.init()),
					switchMap(() => from(storage.create())),
					switchMap(() => from(userService.init())),
					tap(() => interactedService.init())
				)
				.subscribe(resolve);
		});

@NgModule({
	providers: [
		{
			provide: APP_INITIALIZER,
			useFactory: coreFactory,
			deps: [
				ConfigService,
				LogService,
				Storage,
				AuthStorageService,
				UserService,
				InteractedService
			],
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
