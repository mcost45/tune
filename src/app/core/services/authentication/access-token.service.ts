import { Injectable } from '@angular/core';
import { LogService } from '../utility/log.service';
import { LogLevel } from '../../../domain/utility/log-level';
import { AccessTokenInitProps } from '../../../domain/authentication/access-token-init-props';
import { AccessTokenInitKeys } from '../../../domain/authentication/access-token-init-keys';
import { TokenSetProps } from '../../../domain/authentication/token-set-props';
import { TokenSetKeys } from '../../../domain/authentication/token-set-keys';
import { ConfigService } from '../utility/config.service';
import { AccessTokenRefreshProps } from '../../../domain/authentication/access-token-refresh-props';
import { AccessTokenRefreshKeys } from '../../../domain/authentication/access-token-refresh-keys';
import { AuthStorageService } from './auth-storage.service';

@Injectable({
	providedIn: 'root'
})
export class AccessTokenService {
	private static readonly responseNotOk = 'Access token response was not ok.';
	private static readonly missingAccessToken = 'No access token returned.';
	private static readonly missingExpirationTime = 'No expiration time returned.';
	private static readonly missingRefreshToken = 'No refresh token returned.';
	private static readonly storedTokenNotFound = 'Could not find a stored access token.';

	private static readonly refreshTokenWithinExpirationMs = 10000;

	constructor(
		private readonly logger: LogService,
		private readonly configService: ConfigService,
		private readonly authStorageService: AuthStorageService
	) {}

	private static throwResponseError(message: string, body: TokenSetProps) {
		throw new Error(`${message}\nbody: ${JSON.stringify(body)}`);
	}

	private static checkResponseForErrors(response: Response, body: TokenSetProps) {
		if (!response.ok) {
			AccessTokenService.throwResponseError(AccessTokenService.responseNotOk, body);
		}
		if (!body[TokenSetKeys.accessToken]) {
			AccessTokenService.throwResponseError(AccessTokenService.missingAccessToken, body);
		}
		if (!body[TokenSetKeys.expiresIn]) {
			AccessTokenService.throwResponseError(AccessTokenService.missingExpirationTime, body);
		}
		if (!body[TokenSetKeys.refreshToken]) {
			AccessTokenService.throwResponseError(AccessTokenService.missingRefreshToken, body);
		}
	}

	async getAccessToken(): Promise<string> {
		const storedToken = await this.authStorageService.getStoredAccessToken();
		if (!storedToken) {
			throw new Error(AccessTokenService.storedTokenNotFound);
		}

		const tokenSet: TokenSetProps = JSON.parse(storedToken);
		if (this.shouldRefreshToken(tokenSet)) {
			this.logger.log(LogLevel.trace, 'Current token has expired.');

			await this.generateRefreshToken({
				clientId: this.configService.config.auth.clientId,
				grantType: 'refresh_token',
				refreshToken: tokenSet[TokenSetKeys.refreshToken]
			});
		}

		return tokenSet[TokenSetKeys.accessToken];
	}

	async generateInitialAccessToken(props: AccessTokenInitProps): Promise<string> {
		const tokenUrl = this.configService.config.auth.spotifyTokenUri;
		const params: Record<AccessTokenInitKeys, string> = {
			[AccessTokenInitKeys.clientId]: props.clientId,
			[AccessTokenInitKeys.grantType]: props.grantType,
			[AccessTokenInitKeys.code]: props.code,
			[AccessTokenInitKeys.codeVerifier]: props.codeVerifier,
			[AccessTokenInitKeys.redirectUri]: props.redirectUri
		};

		return this.generateAccessToken(tokenUrl, params);
	}

	private shouldRefreshToken(tokenSet: TokenSetProps): boolean {
		return (
			tokenSet[TokenSetKeys.expiresAt] <
			Date.now() - AccessTokenService.refreshTokenWithinExpirationMs
		);
	}

	private async generateRefreshToken(props: AccessTokenRefreshProps): Promise<string> {
		const tokenUrl = this.configService.config.auth.spotifyTokenUri;
		const params: Record<AccessTokenRefreshKeys, string> = {
			[AccessTokenRefreshKeys.clientId]: props.clientId,
			[AccessTokenRefreshKeys.grantType]: props.grantType,
			[AccessTokenRefreshKeys.refreshToken]: props.refreshToken
		};

		return this.generateAccessToken(tokenUrl, params);
	}

	private async generateAccessToken(
		tokenUrl: string,
		params: Record<string, string>
	): Promise<string> {
		this.logger.log(LogLevel.trace, 'Generating a new access token.');

		const response = await fetch(tokenUrl, {
			method: 'POST',
			body: new URLSearchParams(params)
		});
		const body: TokenSetProps = await response.json();
		AccessTokenService.checkResponseForErrors(response, body);

		const accessToken = body[TokenSetKeys.accessToken];
		const expiresAt = Date.now() + 1000 * body[TokenSetKeys.expiresIn];
		this.logger.log(
			LogLevel.trace,
			`Access token expires in ${body[TokenSetKeys.expiresIn] / 60} minutes.`
		);
		await this.authStorageService.storeAccessTokenSet(body, expiresAt);

		return accessToken;
	}
}
