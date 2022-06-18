import { Injectable } from '@angular/core';
import { ConfigService } from '../../../shared/services/utility/config.service';
import { AuthInitProps } from '../../../domain/authentication/auth-init-props';
import { LogService } from '../../../shared/services/utility/log.service';
import { LogLevel } from '../../../shared/domain/utility/log-level';
import { AuthInitKeys } from '../../../domain/authentication/auth-init-keys';
import { AuthStorageService } from './auth-storage.service';

@Injectable({
	providedIn: 'root'
})
export class AuthInitService {
	constructor(
		private readonly logger: LogService,
		private readonly configService: ConfigService,
		private readonly authStorageService: AuthStorageService
	) {}

	private static uInt8ToString(uint8: Uint8Array): string {
		const chunkSize = 0x8000;
		const chunks = [];
		for (let i = 0; i < uint8.length; i += chunkSize) {
			chunks.push(
				String.fromCharCode.apply(null, Array.from(uint8.subarray(i, i + chunkSize)))
			);
		}
		return chunks.join('');
	}

	private static bufferToBase64Url(buffer: ArrayBuffer): string {
		const uint8 = new Uint8Array(buffer);

		return window
			.btoa(AuthInitService.uInt8ToString(uint8))
			.replace(/\+/g, '-')
			.replace(/\//g, '_')
			.replace(/=+$/, '');
	}

	private static generateRandomBytes(size: number): Uint8Array {
		return crypto.getRandomValues(new Uint8Array(size));
	}

	private static generateRandomBase64(size: number): string {
		return AuthInitService.bufferToBase64Url(AuthInitService.generateRandomBytes(size));
	}

	private static generateCodeVerifierOrState(size: number): string {
		return AuthInitService.bufferToBase64Url(AuthInitService.generateRandomBytes(size));
	}

	private static async generateCodeChallenge(codeVerifier: string): Promise<string> {
		const verifierBytes = new TextEncoder().encode(codeVerifier);
		const hashBuffer = await crypto.subtle.digest('SHA-256', verifierBytes);
		return AuthInitService.bufferToBase64Url(hashBuffer);
	}

	async initiateAuthentication(): Promise<void> {
		const { codeVerifier, state, loginUrl } = await this.generateInitAuthProps();

		this.authStorageService.storeInitProps({ codeVerifier, state });
		location.href = loginUrl;
	}

	private async generateInitAuthProps(): Promise<AuthInitProps> {
		const authConfig = this.configService.config.auth;
		const { codeLen, scope } = authConfig;
		const responseType = 'code';
		const codeChallengeMethod = 'S256';

		this.logger.log(
			LogLevel.trace,
			`Generating PKCE OAuth Login details with code length ${codeLen}.`
		);

		const state = AuthInitService.generateCodeVerifierOrState(codeLen);
		const codeVerifier = AuthInitService.generateCodeVerifierOrState(codeLen);
		const codeChallenge = await AuthInitService.generateCodeChallenge(codeVerifier);

		const redirectUri = `${location.origin}/${authConfig.relRedirectUri}`;
		this.logger.log(LogLevel.trace, `Will redirect post-login to ${redirectUri}.`);

		const params: [AuthInitKeys, string][] = [
			[AuthInitKeys.clientId, authConfig.clientId],
			[AuthInitKeys.responseType, responseType],
			[AuthInitKeys.redirectUri, redirectUri],
			[AuthInitKeys.codeChallengeMethod, codeChallengeMethod],
			[AuthInitKeys.codeChallenge, codeChallenge],
			[AuthInitKeys.state, state],
			[AuthInitKeys.scope, scope]
		];

		const urlParams = new URLSearchParams(params);
		const loginUrl = `${authConfig.spotifyAuthUri}?${urlParams}`;

		return {
			codeVerifier,
			state,
			loginUrl
		};
	}
}
