import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { LogService } from './utility/log.service';
import { LogLevel } from '../../domain/utility/log-level';
import { AuthInitService } from './authentication/auth-init.service';
import { AccessTokenService } from './authentication/access-token.service';
import { AuthStorageService } from './authentication/auth-storage.service';

@Injectable({
	providedIn: 'root'
})
export class UserService {
	private readonly userSubject =
		new BehaviorSubject<SpotifyApi.CurrentUsersProfileResponse | null>(null);

	private readonly user$: Observable<SpotifyApi.CurrentUsersProfileResponse | null> =
		this.userSubject.asObservable();

	constructor(
		private readonly logger: LogService,
		private readonly authInitService: AuthInitService,
		private readonly accessTokenService: AccessTokenService,
		private readonly authStorageService: AuthStorageService
	) {}

	public async init(): Promise<void> {
		const user = await this.authStorageService.getUser();
		if (user) {
			this.userSubject.next(JSON.parse(user));
		}
	}

	public async setUser(user: SpotifyApi.CurrentUsersProfileResponse): Promise<void> {
		await this.authStorageService.storeUser(user);
		this.userSubject.next(user);
		this.logger.log(LogLevel.trace, `User '${user.display_name}' set.`);
	}

	public async removeUser(): Promise<void> {
		await this.authStorageService.removeUser();
		await this.authStorageService.removeAccessTokenSet();
		this.userSubject.next(null);
		this.logger.log(LogLevel.trace, `User removed.`);
	}

	public getUser$(): Observable<SpotifyApi.CurrentUsersProfileResponse | null> {
		return this.user$;
	}

	public async withToken<T>(callback: (token: string) => T): Promise<T> {
		return callback(await this.accessTokenService.getAccessToken());
	}
}
