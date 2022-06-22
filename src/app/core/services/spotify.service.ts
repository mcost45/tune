import { Injectable } from '@angular/core';
import SpotifyWebApi from 'spotify-web-api-js';
import { firstValueFrom, Observable } from 'rxjs';
import { LogLevel } from '../../shared/domain/utility/log-level';
import { waitTime } from '../../utility/wait-time';
import { SpotifyCallKeys } from '../../feed/domain/spotify-call-keys';
import { LogService } from '../../shared/services/utility/log.service';
import { UserService } from './user.service';

@Injectable({
	providedIn: 'root'
})
// A wrapper for the JS Spotify Web API.
export class SpotifyService {
	static readonly maxRecommendationSeedSum = 5;

	private static readonly recommendationRequestHasTooManySeeds =
		'Recommendation request has too many seeds.';

	private static readonly retryOnErrorMs = 5000;

	private readonly api = new SpotifyWebApi();
	private readonly user$: Observable<SpotifyApi.CurrentUsersProfileResponse | null>;

	constructor(private readonly logger: LogService, private readonly userService: UserService) {
		this.user$ = this.userService.getUser$();
	}

	getUser(): Promise<SpotifyApi.CurrentUsersProfileResponse | undefined> {
		this.logger.log(LogLevel.trace, 'Fetching current user.');
		return this.tryAPICall(() => this.api.getMe());
	}

	async getRecommendations(
		maxAmount: number,
		seedTrackIds: string[] = [],
		seedArtistIds: string[] = []
	): Promise<SpotifyApi.RecommendationsFromSeedsResponse | undefined> {
		this.logger.log(LogLevel.trace, `Fetching up to ${maxAmount} recommendations.`);
		this.checkRecommendationsRequestSeeds(seedArtistIds, seedTrackIds);

		const market = await this.getUserMarket();
		const options: SpotifyApi.RecommendationsOptionsObject = {
			[SpotifyCallKeys.seedArtists]: seedArtistIds,
			[SpotifyCallKeys.seedTracks]: seedTrackIds,
			[SpotifyCallKeys.limit]: maxAmount,
			[SpotifyCallKeys.market]: market
		};

		return this.tryAPICall(() => this.api.getRecommendations(options));
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
		this.logger.log(LogLevel.trace, `Liking ${trackIds.length} tracks.`);
		return this.tryAPICall(() => this.api.addToMySavedTracks(trackIds));
	}

	async getDetailedTracks(
		trackIds: string[]
	): Promise<SpotifyApi.MultipleTracksResponse | undefined> {
		this.logger.log(LogLevel.trace, `Fetching ${trackIds.length} tracks.`);
		return this.tryAPICall(() => this.api.getTracks(trackIds));
	}

	async getDetailedArtists(
		artistIds: string[]
	): Promise<SpotifyApi.MultipleArtistsResponse | undefined> {
		this.logger.log(LogLevel.trace, `Fetching ${artistIds.length} artists.`);
		return this.tryAPICall(() => this.api.getArtists(artistIds));
	}

	async getTrackFeatures(
		trackIds: string[]
	): Promise<SpotifyApi.MultipleAudioFeaturesResponse | undefined> {
		this.logger.log(LogLevel.trace, `Fetching ${trackIds.length} track features.`);
		return this.tryAPICall(() => this.api.getAudioFeaturesForTracks(trackIds));
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

	private async getUserMarket(): Promise<string> {
		const user = await firstValueFrom(this.user$);
		return (user as SpotifyApi.CurrentUsersProfileResponse).country;
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
