import { Injectable } from '@angular/core';
import { SpotifyService } from '../../core/services/spotify.service';
import { LogService } from '../../core/services/utility/log.service';
import { LogLevel } from '../../domain/utility/log-level';
import { FeedStorageService } from './feed-storage.service';

@Injectable()
export class FeedService {
	private static readonly failedToFillSeeds = 'Failed to fill seeds.';

	private static readonly maxStoredSeedsLen = 40;
	private static readonly fetchSeedsLen = 20;

	private trackList: SpotifyApi.TrackObjectSimplified[] = [];
	private artistList: SpotifyApi.ArtistObjectFull[] = [];

	constructor(
		private readonly logger: LogService,
		private readonly spotifyService: SpotifyService,
		private readonly feedStorageService: FeedStorageService
	) {}

	init(): Promise<void> {
		return this.fillSeedsIfEmpty();
	}

	private async determineInitialSeeds(): Promise<void> {
		//
	}

	private addTrackSeed() {
		const trackLen = this.trackList.length;
		if (trackLen) {
			//
		}
	}

	private addArtistSeed() {
		//
	}

	private async fillSeedsIfEmpty(): Promise<void> {
		let [tracks, artist] = await Promise.all([
			this.feedStorageService.getTracks(),
			this.feedStorageService.getArtists()
		]);

		if (!tracks || !artist) {
			this.logger.log(LogLevel.trace, 'Filling empty track and artist seeds.');

			const [topTracksResponse, topArtistsResponse] = await Promise.all([
				this.spotifyService.getTopTracks(FeedService.fetchSeedsLen),
				this.spotifyService.getTopArtists(FeedService.fetchSeedsLen)
			]);

			tracks = topTracksResponse?.items;
			artist = topArtistsResponse?.items;

			if (!tracks || !artist) {
				throw new Error(FeedService.failedToFillSeeds);
			}

			await Promise.all([
				this.feedStorageService.storeTracks(tracks),
				this.feedStorageService.storeArtists(artist)
			]);
		} else {
			this.logger.log(LogLevel.trace, 'Track and artist seeds already existing.');
		}

		this.trackList = tracks;
		this.artistList = artist;
	}
}
