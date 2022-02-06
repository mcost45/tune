import { Injectable } from '@angular/core';
import { AuthCallbackProps } from '../../../domain/authentication/auth-callback-props';
import { AuthStorageService } from './auth-storage.service';
import { LogService } from '../utility/log.service';
import { LogLevel } from '../../../domain/utility/log-level';
import { ConfigService } from '../utility/config.service';
import { AccessTokenService } from './access-token.service';
import { LoginService } from '../login.service';

@Injectable({
	providedIn: 'root'
})
export class AuthCallbackService {
	private static codeMissing = 'Response has no code parameter.';

	private static stateMissing = 'Response has no state parameter.';

	private static stateMismatch = 'Response has no state parameter.';

	constructor(
		private readonly logger: LogService,
		private readonly configService: ConfigService,
		private readonly authStorageService: AuthStorageService,
		private readonly accessTokenService: AccessTokenService,
		private readonly loginService: LoginService
	) {}

	private static checkForErrors(
		{ error, state, code }: AuthCallbackProps,
		storedState: string
	): void {
		if (error) {
			throw new Error(error);
		}
		if (!state) {
			throw new Error(AuthCallbackService.stateMissing);
		}
		if (!code) {
			throw new Error(AuthCallbackService.codeMissing);
		}
		if (state !== storedState) {
			throw new Error(AuthCallbackService.stateMismatch);
		}
	}

	public async handleAuthResponse(params: URLSearchParams): Promise<void> {
		const error = params.get('error');
		const state = params.get('state');
		const code = params.get('code');

		const { state: storedState, codeVerifier: storedCodeVerifier } =
			this.authStorageService.getStoredInitProps();

		try {
			AuthCallbackService.checkForErrors({ error, state, code }, storedState);
		} catch (e) {
			return await this.loginService.onFailedLogin(error || '');
		}

		this.logger.log(LogLevel.trace, 'Successfully authenticated user.');

		const authConfig = this.configService.config.auth;
		await this.accessTokenService.generateInitialAccessToken({
			clientId: authConfig.clientId,
			code: code as string,
			codeVerifier: storedCodeVerifier,
			grantType: 'authorization_code',
			redirectUri: `${location.origin}/${authConfig.relRedirectUri}`
		});

		await this.loginService.onCompletedLogin();
	}
}
