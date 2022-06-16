import { Injectable } from '@angular/core';
import { Storage } from '@ionic/storage-angular';
import { LogLevel } from '../../domain/utility/log-level';
import { LogService } from '../../core/services/utility/log.service';

@Injectable({
	providedIn: 'root'
})
export class FeedStorageService {
	private static readonly trackKey = 'feed-tracks';
	private static readonly artistsKey = 'feed-artists';

	constructor(private readonly logger: LogService, private readonly storage: Storage) {}

	async storeTracks(tracks: SpotifyApi.TrackObjectSimplified[]): Promise<void> {
		await this.storage.set(FeedStorageService.trackKey, JSON.stringify(tracks));
		this.logger.log(LogLevel.trace, 'New tracks stored.');
	}

	async getTracks(): Promise<SpotifyApi.TrackObjectSimplified[] | undefined> {
		return JSON.parse(await this.storage.get(FeedStorageService.trackKey));
	}

	async removeTracks(): Promise<void> {
		await this.storage.remove(FeedStorageService.trackKey);
		this.logger.log(LogLevel.trace, 'Tracks removed.');
	}

	async storeArtists(artists: SpotifyApi.ArtistObjectFull[]): Promise<void> {
		await this.storage.set(FeedStorageService.artistsKey, JSON.stringify(artists));
		this.logger.log(LogLevel.trace, 'New artists stored.');
	}

	async getArtists(): Promise<SpotifyApi.ArtistObjectFull[] | undefined> {
		return JSON.parse(await this.storage.get(FeedStorageService.artistsKey));
	}

	async removeArtists(): Promise<void> {
		await this.storage.remove(FeedStorageService.artistsKey);
		this.logger.log(LogLevel.trace, 'Artists removed.');
	}
}
