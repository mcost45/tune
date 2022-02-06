import { Injectable } from '@angular/core';
import { Storage } from '@ionic/storage-angular';
import { AuthStorageProps } from '../../../domain/authentication/auth-storage-props';
import { LogService } from '../utility/log.service';
import { LogLevel } from '../../../domain/utility/log-level';
import { TokenSetProps } from '../../../domain/authentication/token-set-props';

@Injectable({
	providedIn: 'root'
})
export class AuthStorageService {
	private static missingCodeVerifierProp = 'Could not find stored codeVerifier.';

	private static missingStateProp = 'Could not find stored state.';

	private static accessTokenSetKey = 'tokenSet';

	private static userKey = 'user';

	constructor(private readonly logger: LogService, private storage: Storage) {}

	public async init(): Promise<void> {
		await this.storage.create();
	}

	public storeInitProps({ codeVerifier, state }: AuthStorageProps): void {
		sessionStorage.setItem('codeVerifier', codeVerifier);
		sessionStorage.setItem('state', state);

		this.logger.log(LogLevel.trace, 'Auth init props stored.');
	}

	public getStoredInitProps(): AuthStorageProps {
		const codeVerifier = sessionStorage.getItem('codeVerifier');
		const state = sessionStorage.getItem('state');

		if (!codeVerifier) {
			throw new Error(AuthStorageService.missingCodeVerifierProp);
		}
		if (!state) {
			throw new Error(AuthStorageService.missingStateProp);
		}

		return { codeVerifier, state };
	}

	public async storeAccessTokenSet(body: TokenSetProps, expiresAt: number): Promise<void> {
		await this.storage.set(
			AuthStorageService.accessTokenSetKey,
			JSON.stringify({ ...body, expiresAt })
		);
		this.logger.log(LogLevel.trace, 'New tokenSet stored.');
	}

	public async removeAccessTokenSet(): Promise<void> {
		await this.storage.remove(AuthStorageService.accessTokenSetKey);
		this.logger.log(LogLevel.trace, 'TokenSet storage removed.');
	}

	public async getStoredAccessToken(): Promise<string | null> {
		return await this.storage.get(AuthStorageService.accessTokenSetKey);
	}

	public async storeUser(user: SpotifyApi.CurrentUsersProfileResponse): Promise<void> {
		await this.storage.set(AuthStorageService.userKey, JSON.stringify(user));
		this.logger.log(LogLevel.trace, 'New user stored.');
	}

	public async removeUser(): Promise<void> {
		await this.storage.remove(AuthStorageService.userKey);
		this.logger.log(LogLevel.trace, 'User storage removed.');
	}

	public async getUser(): Promise<string | null> {
		return await this.storage.get(AuthStorageService.userKey);
	}
}
