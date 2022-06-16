import { Injectable } from '@angular/core';
import SpotifyWebApi from 'spotify-web-api-js';
import { LogLevel } from '../../domain/utility/log-level';
import { waitTime } from '../utility/wait-time';
import { SpotifyCallKeys } from '../../domain/authentication/spotify-call-keys';
import { UserService } from './user.service';
import { LogService } from './utility/log.service';

@Injectable({
	providedIn: 'root'
})
// A wrapper for the JS Spotify Web API.
export class SpotifyService {
	static readonly maxRecommendationSeedSum = 5;

	private static readonly recommendationRequestHasTooManySeeds =
		'Recommendation request has too many seeds.';

	private static readonly retryOnErrorMs = 2000;

	private readonly api = new SpotifyWebApi();

	constructor(private readonly logger: LogService, private readonly userService: UserService) {}

	getUser(): Promise<SpotifyApi.CurrentUsersProfileResponse | undefined> {
		this.logger.log(LogLevel.trace, 'Fetching current user.');
		return this.tryAPICall(() => this.api.getMe());
	}

	getRecommendations(
		amount: number,
		seedArtistIds: string[] = [],
		seedTrackIds: string[] = [],
		seedGenres: string[] = []
	): Promise<SpotifyApi.RecommendationsFromSeedsResponse | undefined> {
		this.logger.log(LogLevel.trace, `Fetching ${amount} recommendations.`);
		this.checkRecommendationsRequestSeeds(seedArtistIds, seedTrackIds, seedGenres);
		return this.tryAPICall(() =>
			this.api.getRecommendations({
				[SpotifyCallKeys.seedArtists]: seedArtistIds,
				[SpotifyCallKeys.seedTracks]: seedTrackIds,
				[SpotifyCallKeys.seedGenres]: seedGenres
			})
		);
	}

	getTopTracks(amount: number): Promise<SpotifyApi.UsersTopTracksResponse | undefined> {
		this.logger.log(LogLevel.trace, `Fetching top ${amount} tracks.`);
		return this.tryAPICall(() => this.api.getMyTopTracks({ limit: amount }));
	}

	getTopArtists(amount: number): Promise<SpotifyApi.UsersTopArtistsResponse | undefined> {
		this.logger.log(LogLevel.trace, `Fetching top ${amount} artists.`);
		return this.tryAPICall(() => this.api.getMyTopArtists({ limit: amount }));
	}

	likeTracks(trackIds: string[]): Promise<SpotifyApi.SaveTracksForUserResponse | undefined> {
		this.logger.log(LogLevel.trace, `Liking ${trackIds.length} track.`);
		return this.tryAPICall(() => this.api.addToMySavedTracks(trackIds));
	}

	private tryAPICall<T>(
		apiCallFn: () => Promise<T>,
		retryOnFailure = true
	): Promise<T | undefined> {
		return this.ensureValidToken().then(() =>
			apiCallFn().then(
				(output) => output,
				(e) => {
					this.onApiError(e);
					if (retryOnFailure) {
						return waitTime(SpotifyService.retryOnErrorMs).then(() => {
							return this.tryAPICall(apiCallFn, false);
						});
					}
					return undefined;
				}
			)
		);
	}

	private ensureValidToken(): Promise<void> {
		return this.userService.withToken((token) => {
			this.api.setAccessToken(token);
			this.logger.log(LogLevel.trace, `Token (length ${token.length}) validated.`);
		});
	}

	private onApiError(e: SpotifyApi.ErrorObject) {
		this.logger.log(LogLevel.error, `[${e.status}] ${e.message}`);
	}

	private checkRecommendationsRequestSeeds(...seedSources: string[][]) {
		let count = 0;
		for (const seed of seedSources) {
			count += seed.length;
			if (count > SpotifyService.maxRecommendationSeedSum) {
				throw new Error(SpotifyService.recommendationRequestHasTooManySeeds);
			}
		}
		return;
	}
}
