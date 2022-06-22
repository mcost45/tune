import { Injectable } from '@angular/core';
import { Storage } from '@ionic/storage-angular';
import { LogLevel } from '../../shared/domain/utility/log-level';
import { LogService } from '../../shared/services/utility/log.service';
import { waitParallel } from '../../utility/wait-parallel';

@Injectable({
	providedIn: 'root'
})
export class FeedStorageService {
	private static readonly topTrackCountKey = 'count-top-tracks';
	private static readonly topArtistCountKey = 'count-top-artists';
	private static readonly trackKey = 'feed-tracks';
	private static readonly artistsKey = 'feed-artists';
	private static readonly historyKey = 'history-tracks';

	constructor(private readonly logger: LogService, private readonly storage: Storage) {}

	async storeTrackIdsHistory(trackIds: string[]): Promise<void> {
		await this.storage.set(FeedStorageService.historyKey, JSON.stringify(trackIds));
		this.logger.log(LogLevel.trace, `New track ids history [${trackIds.length}] stored.`);
	}

	async getTrackIdsHistory(): Promise<string[]> {
		return JSON.parse(await this.storage.get(FeedStorageService.historyKey)) || [];
	}

	async storeTopTrackCount(count: number): Promise<void> {
		await this.storage.set(FeedStorageService.topTrackCountKey, JSON.stringify(count));
		this.logger.log(LogLevel.trace, `New top track count stored [${count}]`);
	}

	async getTopTrackCount(): Promise<number> {
		return JSON.parse(await this.storage.get(FeedStorageService.topTrackCountKey)) || 0;
	}

	async storeTrackSeeds(tracks: SpotifyApi.TrackObjectSimplified[]): Promise<void> {
		await this.storage.set(FeedStorageService.trackKey, JSON.stringify(tracks));
		this.logger.log(LogLevel.trace, `New track seeds stored [${tracks.length}].`);
	}

	async getTrackSeeds(): Promise<SpotifyApi.TrackObjectSimplified[] | undefined> {
		return JSON.parse(await this.storage.get(FeedStorageService.trackKey));
	}

	async storeTopArtistCount(count: number): Promise<void> {
		await this.storage.set(FeedStorageService.topArtistCountKey, JSON.stringify(count));
		this.logger.log(LogLevel.trace, `New top artist count stored [${count}].`);
	}

	async getTopArtistCount(): Promise<number> {
		return JSON.parse(await this.storage.get(FeedStorageService.topArtistCountKey)) || 0;
	}

	async storeArtistSeeds(
		artists: (SpotifyApi.ArtistObjectFull | SpotifyApi.ArtistObjectSimplified)[]
	): Promise<void> {
		await this.storage.set(FeedStorageService.artistsKey, JSON.stringify(artists));
		this.logger.log(LogLevel.trace, `New artist seeds stored [${artists.length}].`);
	}

	async getArtistSeeds(): Promise<
		(SpotifyApi.ArtistObjectFull | SpotifyApi.ArtistObjectSimplified)[] | undefined
	> {
		return JSON.parse(await this.storage.get(FeedStorageService.artistsKey));
	}

	async removeAll(): Promise<[void, void, void, void, void]> {
		return waitParallel(
			this.removeTracks(),
			this.removeTopTracksCount(),
			this.removeArtists(),
			this.removeTopArtistCount(),
			this.removeTrackIdsHistory()
		);
	}

	private async removeTrackIdsHistory(): Promise<void> {
		await this.storage.remove(FeedStorageService.historyKey);
		this.logger.log(LogLevel.trace, 'Track history ids removed.');
	}

	private async removeTopTracksCount(): Promise<void> {
		await this.storage.remove(FeedStorageService.topTrackCountKey);
		this.logger.log(LogLevel.trace, 'Top tracks count removed.');
	}

	private async removeTracks(): Promise<void> {
		await this.storage.remove(FeedStorageService.trackKey);
		this.logger.log(LogLevel.trace, 'Tracks removed.');
	}

	private async removeTopArtistCount(): Promise<void> {
		await this.storage.remove(FeedStorageService.topArtistCountKey);
		this.logger.log(LogLevel.trace, 'Top artists count removed.');
	}

	private async removeArtists(): Promise<void> {
		await this.storage.remove(FeedStorageService.artistsKey);
		this.logger.log(LogLevel.trace, 'Artists removed.');
	}
}
