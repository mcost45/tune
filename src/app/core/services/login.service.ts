import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { LogLevel } from '../../domain/utility/log-level';
import { LogService } from './utility/log.service';
import { AuthInitService } from './authentication/auth-init.service';
import { AccessTokenService } from './authentication/access-token.service';
import { SpotifyService } from './spotify.service';
import { UserService } from './user.service';
import { AuthStorageService } from './authentication/auth-storage.service';
import { ConfigService } from './utility/config.service';

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
		const user = await this.spotifyService.getUser();
		if (user) {
			await this.userService.setUser(user);
			this.logger.log(LogLevel.trace, 'Completed login.');
			return this.redirectToSuccessPage();
		}

		throw new Error(LoginService.noUser);
	}

	async onFailedLogin(error: string): Promise<void> {
		await this.redirectToFailedPage(error);
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

	private async redirectToFailedPage(error: string): Promise<void> {
		this.logger.log(LogLevel.error, error);
		const authConfig = this.configService.config.auth;
		await this.router.navigateByUrl(authConfig.postFailedRoute);
	}

	private async redirectToLoggedOutPage(): Promise<void> {
		const authConfig = this.configService.config.auth;
		await this.router.navigateByUrl(authConfig.postLogoutRoute);
	}
}
