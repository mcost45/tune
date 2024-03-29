import { Injectable } from '@angular/core';
import { Storage } from '@ionic/storage-angular';
import { AuthStorageProps } from '../../domain/authentication/auth-storage-props';
import { LogService } from '../../../shared/services/utility/log.service';
import { LogLevel } from '../../../shared/domain/utility/log-level';
import { TokenSetProps } from '../../domain/authentication/token-set-props';
import { TokenSetKeys } from '../../domain/authentication/token-set-keys';
import { waitParallel } from '../../../utility/wait-parallel';

@Injectable({
	providedIn: 'root'
})
export class AuthStorageService {
	private static missingCodeVerifierProp = 'Could not find stored codeVerifier.';
	private static missingStateProp = 'Could not find stored state.';

	private static accessTokenSetKey = 'auth-tokenSet';
	private static userKey = 'auth-user';

	constructor(private readonly logger: LogService, private readonly storage: Storage) {}

	storeInitProps({ codeVerifier, state }: AuthStorageProps) {
		sessionStorage.setItem('codeVerifier', codeVerifier);
		sessionStorage.setItem('state', state);

		this.logger.log(LogLevel.trace, 'Auth init props stored.');
	}

	getStoredInitProps(): AuthStorageProps {
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

	async storeAccessTokenSet(body: TokenSetProps, expiresAt: number): Promise<void> {
		await this.storage.set(
			AuthStorageService.accessTokenSetKey,
			JSON.stringify({ ...body, [TokenSetKeys.expiresAt]: expiresAt })
		);
		this.logger.log(LogLevel.trace, 'New tokenSet stored.');
	}

	getStoredAccessToken(): Promise<string | undefined> {
		return this.storage.get(AuthStorageService.accessTokenSetKey);
	}

	async storeUser(user: SpotifyApi.CurrentUsersProfileResponse): Promise<void> {
		await this.storage.set(AuthStorageService.userKey, JSON.stringify(user));
		this.logger.log(LogLevel.trace, 'New user stored.');
	}

	getUser(): Promise<string | undefined> {
		return this.storage.get(AuthStorageService.userKey);
	}

	async removeAll(): Promise<[void, void]> {
		return waitParallel(this.removeUser(), this.removeAccessTokenSet());
	}

	async removeAccessTokenSet(): Promise<void> {
		await this.storage.remove(AuthStorageService.accessTokenSetKey);
		this.logger.log(LogLevel.trace, 'TokenSet storage removed.');
	}

	private async removeUser(): Promise<void> {
		await this.storage.remove(AuthStorageService.userKey);
		this.logger.log(LogLevel.trace, 'User storage removed.');
	}
}
