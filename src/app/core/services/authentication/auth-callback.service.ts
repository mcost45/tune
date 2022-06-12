import { Injectable } from '@angular/core';
import { AuthCallbackProps } from '../../../domain/authentication/auth-callback-props';
import { LogService } from '../utility/log.service';
import { ConfigService } from '../utility/config.service';
import { LoginService } from '../login.service';
import { LogLevel } from '../../../domain/utility/log-level';
import { AccessTokenService } from './access-token.service';
import { AuthStorageService } from './auth-storage.service';

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

	async handleAuthResponse(params: URLSearchParams): Promise<void> {
		const error = params.get('error');
		const state = params.get('state');
		const code = params.get('code');

		let storedCodeVerifier: string;

		try {
			const stored = this.validatePrerequisites({
				error,
				state,
				code
			});
			storedCodeVerifier = stored.codeVerifier;
		} catch (e) {
			return await this.loginService.onFailedLogin(error || '');
		}

		await this.beginLogin(code as string, storedCodeVerifier);
	}

	private validatePrerequisites(params: {
		error: string | null;
		state: string | null;
		code: string | null;
	}): {
		state: string;
		codeVerifier: string;
	} {
		const { state, codeVerifier } = this.authStorageService.getStoredInitProps();

		AuthCallbackService.checkForErrors(params, state);

		this.logger.log(LogLevel.trace, 'Successfully authenticated user.');
		return { state, codeVerifier };
	}

	private async beginLogin(code: string, codeVerifier: string): Promise<void> {
		const authConfig = this.configService.config.auth;

		await this.accessTokenService.generateInitialAccessToken({
			clientId: authConfig.clientId,
			code,
			codeVerifier,
			grantType: 'authorization_code',
			redirectUri: `${location.origin}/${authConfig.relRedirectUri}`
		});

		await this.loginService.onCompletedLogin();
	}
}
