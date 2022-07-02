import { ChangeDetectionStrategy, Component, OnDestroy } from '@angular/core';
import { Location } from '@angular/common';
import { from, ReplaySubject, switchMap, take, takeUntil } from 'rxjs';
import { ActivatedRoute } from '@angular/router';
import { AuthCallbackService } from '../../../core/services/authentication/auth-callback.service';
import { UserService } from '../../../core/services/user.service';
import { LogService } from '../../../shared/services/utility/log.service';
import { LoginService } from '../../../core/services/login.service';
import { ConfigService } from '../../../shared/services/utility/config.service';

@Component({
	selector: 'app-auth-callback',
	template: '',
	changeDetection: ChangeDetectionStrategy.OnPush
})
export class AuthCallbackComponent implements OnDestroy {
	private readonly destroyedS = new ReplaySubject<boolean>(1);

	constructor(
		private readonly logger: LogService,
		private readonly location: Location,
		private readonly route: ActivatedRoute,
		private readonly configService: ConfigService,
		private readonly userService: UserService,
		private readonly loginService: LoginService,
		private readonly authCallbackService: AuthCallbackService
	) {
		route.params
			.pipe(
				switchMap(() => from(this.initiate())),
				takeUntil(this.destroyedS)
			)
			.subscribe();
	}

	ngOnDestroy() {
		this.destroyedS.next(true);
		this.destroyedS.complete();
	}

	async initiate() {
		const urlParams = new URLSearchParams(location.search);

		this.userService
			.getUser$()
			.pipe(
				take(1),
				switchMap((user) => {
					if (user) {
						this.allowPrevNavAfterAuth();
					}
					return from(this.authCallbackService.handleAuthResponse(urlParams));
				}),
				takeUntil(this.destroyedS)
			)
			.subscribe();
	}

	private allowPrevNavAfterAuth() {
		const authConfig = this.configService.config.auth;
		this.location.replaceState(authConfig.postLogoutRoute);
		this.location.back();
	}
}
