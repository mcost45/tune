import { Injectable } from '@angular/core';
import SpotifyWebApi from 'spotify-web-api-js';
import { LogLevel } from '../../domain/utility/log-level';
import { UserService } from './user.service';
import { LogService } from './utility/log.service';

@Injectable({
	providedIn: 'root'
})
// A wrapper for the JS Spotify Web API.
export class SpotifyService {
	private readonly api = new SpotifyWebApi();

	constructor(private readonly logger: LogService, private readonly userService: UserService) {}

	async getCurrentUser(): Promise<SpotifyApi.CurrentUsersProfileResponse> {
		this.logger.log(LogLevel.trace, 'Fetching current user.');
		await this.ensureValidToken();
		return await this.api.getMe();
	}

	private async ensureValidToken(): Promise<void> {
		await this.userService.withToken((token) => {
			this.api.setAccessToken(token);
			this.logger.log(LogLevel.trace, `Token (length ${token.length}) validated.`);
		});
	}
}
