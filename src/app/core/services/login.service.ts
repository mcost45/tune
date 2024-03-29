import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { LogLevel } from '../../shared/domain/utility/log-level';
import { LogService } from '../../shared/services/utility/log.service';
import { ConfigService } from '../../shared/services/utility/config.service';
import { unknownErrorToString } from '../../utility/unknown-error-to-string';
import { AuthInitService } from './authentication/auth-init.service';
import { AccessTokenService } from './authentication/access-token.service';
import { SpotifyService } from './spotify.service';
import { UserService } from './user.service';
import { AuthStorageService } from './authentication/auth-storage.service';

@Injectable({
	providedIn: 'root'
})
export class LoginService {
	private static noUser = 'No user found.';

	constructor(
		private readonly logger: LogService,
		private readonly configService: ConfigService,
		private readonly authInitService: AuthInitService,
		private readonly authStorageService: AuthStorageService,
		private readonly accessTokenService: AccessTokenService,
		private readonly spotifyService: SpotifyService,
		private readonly userService: UserService,
		private readonly router: Router
	) {}

	async initLogin(): Promise<void> {
		this.logger.log(LogLevel.trace, 'Begin login.');

		const token = await this.authStorageService.getStoredAccessToken();
		if (token) {
			this.logger.log(LogLevel.trace, 'Existing token found.');
			await this.onCompletedLogin();
		} else {
			this.logger.log(LogLevel.trace, 'No existing token found.');
			await this.authInitService.initiateAuthentication();
		}
	}

	async onCompletedLogin(): Promise<void> {
		try {
			const user = await this.spotifyService.getUser();

			if (user) {
				await this.userService.setUser(user);
				this.logger.log(LogLevel.trace, 'Completed login.');
				return this.redirectToSuccessPage();
			}

			throw new Error(LoginService.noUser);
		} catch (e) {
			return this.onFailedLogin(unknownErrorToString(e));
		}
	}

	async onFailedLogin(error?: string | null): Promise<void> {
		if (error) {
			this.logger.log(LogLevel.error, error);
		}
		await this.userService.removeUser();
		await this.redirectToFailedPage();
	}

	async logout(): Promise<void> {
		await this.userService.removeUser();
		await this.redirectToLoggedOutPage();
		location.reload();
	}

	private async redirectToSuccessPage(): Promise<void> {
		const authConfig = this.configService.config.auth;
		await this.router.navigateByUrl(authConfig.postSuccessRoute);
	}

	private async redirectToFailedPage(): Promise<void> {
		const authConfig = this.configService.config.auth;
		await this.router.navigateByUrl(authConfig.postFailedRoute);
	}

	private async redirectToLoggedOutPage(): Promise<void> {
		const authConfig = this.configService.config.auth;
		await this.router.navigateByUrl(authConfig.postLogoutRoute);
	}
}
