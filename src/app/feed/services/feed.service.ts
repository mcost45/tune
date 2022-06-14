import { Injectable } from '@angular/core';
import { SpotifyService } from '../../core/services/spotify.service';
import { FeedStorageService } from './feed-storage.service';

@Injectable()
export class FeedService {
	constructor(
		private readonly spotifyService: SpotifyService,
		private readonly feedStorageService: FeedStorageService
	) {
		this.test();
	}

	async test(): Promise<void> {
		console.log(await this.spotifyService.getTopTracks(5));
		console.log(await this.spotifyService.getTopArtists(6));
	}

	private async determineInitialSeeds(): Promise<void> {
		//
	}
}
