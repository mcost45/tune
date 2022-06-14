import { Injectable } from '@angular/core';
import { Storage } from '@ionic/storage-angular';
import { LogLevel } from '../../domain/utility/log-level';
import { LogService } from '../../core/services/utility/log.service';

@Injectable()
export class FeedStorageService {
	private static readonly trackKey = 'feed-tracks';
	private static readonly artistsKey = 'feed-artists';
	private static readonly genresKey = 'feed-genres';

	constructor(private readonly logger: LogService, private readonly storage: Storage) {}

	async storeTracks(tracks: any): Promise<void> {
		await this.storage.set(FeedStorageService.trackKey, JSON.stringify(tracks));
		this.logger.log(LogLevel.trace, 'New tracks stored.');
	}

	async getTracks(): Promise<any | null> {
		return await this.storage.get(FeedStorageService.trackKey);
	}

	async storeArtists(artists: any): Promise<void> {
		await this.storage.set(FeedStorageService.artistsKey, JSON.stringify(artists));
		this.logger.log(LogLevel.trace, 'New artists stored.');
	}

	async getArtists(): Promise<any | null> {
		return await this.storage.get(FeedStorageService.artistsKey);
	}

	async storeGenres(genres: any): Promise<void> {
		await this.storage.set(FeedStorageService.genresKey, JSON.stringify(genres));
		this.logger.log(LogLevel.trace, 'New genres stored.');
	}

	async getGenres(): Promise<any | null> {
		return await this.storage.get(FeedStorageService.genresKey);
	}
}
