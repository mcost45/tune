import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { LogService } from './utility/log.service';
import { AuthInitService } from './authentication/auth-init.service';
import { AccessTokenService } from './authentication/access-token.service';
import { SpotifyService } from './spotify.service';
import { LogLevel } from '../../domain/utility/log-level';
import { UserService } from './user.service';
import { AuthStorageService } from './authentication/auth-storage.service';

@Injectable({
	providedIn: 'root'
})
export class LoginService {
	private static successUrl = '/';
	private static failedUrl = '/login-failed';

	private static noUser = 'No user found.';

	constructor(
		private readonly logger: LogService,
		private readonly authInitService: AuthInitService,
		private readonly authStorageService: AuthStorageService,
		private readonly accessTokenService: AccessTokenService,
		private readonly spotifyService: SpotifyService,
		private readonly userService: UserService,
		private readonly router: Router
	) {}

	public async initLogin(): Promise<void> {
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

	public async onCompletedLogin(): Promise<void> {
		const user = await this.spotifyService.getCurrentUser();
		if (user) {
			await this.userService.setUser(user);
			this.logger.log(LogLevel.trace, 'Completed login.');
			return await this.redirectToSuccessPage();
		}

		throw new Error(LoginService.noUser);
	}

	public async onFailedLogin(error: string): Promise<void> {
		await this.redirectToFailedPage(error);
	}

	public async logout(): Promise<void> {
		this.logger.log(LogLevel.trace, 'Logout.');
		await this.userService.removeUser();
		await this.redirectToSuccessPage();
	}

	private async redirectToSuccessPage(): Promise<void> {
		await this.router.navigateByUrl(LoginService.successUrl);
	}

	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	private async redirectToFailedPage(error: string): Promise<void> {
		// Use error as url param.
		await this.router.navigateByUrl(LoginService.failedUrl);
	}
}
