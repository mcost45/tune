import { Injectable } from '@angular/core';
import { BehaviorSubject, filter, map, Observable } from 'rxjs';
import { LogLevel } from '../../shared/domain/utility/log-level';
import { FeedStorageService } from '../../feed/services/feed-storage.service';
import { waitParallel } from '../../utility/wait-parallel';
import { LogService } from '../../shared/services/utility/log.service';
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
		private readonly authStorageService: AuthStorageService,
		private readonly feedStorageService: FeedStorageService
	) {}

	async init(): Promise<void> {
		const user = await this.authStorageService.getUser();
		if (user) {
			this.userSubject.next(JSON.parse(user));
		}
	}

	async setUser(user: SpotifyApi.CurrentUsersProfileResponse): Promise<void> {
		await this.authStorageService.storeUser(user);
		this.userSubject.next(user);
		this.logger.log(LogLevel.trace, `User '${user.display_name}' set.`);
	}

	async removeUser(): Promise<void> {
		await waitParallel(
			this.authStorageService.removeAll(),
			this.feedStorageService.removeAll()
		);

		this.userSubject.next(null);
		this.logger.log(LogLevel.trace, `User removed.`);
	}

	getUser$(): Observable<SpotifyApi.CurrentUsersProfileResponse | null> {
		return this.user$;
	}

	getImageUrl$(): Observable<string | null> {
		return this.user$.pipe(
			filter((user) => !!user),
			map((user) => {
				const images = (user as SpotifyApi.CurrentUsersProfileResponse).images;
				const len = images?.length;
				if (len) {
					return images?.[0].url;
				}
				return null;
			})
		);
	}

	async withToken<T>(callback: (token: string) => T): Promise<T> {
		return callback(await this.accessTokenService.getAccessToken());
	}
}
