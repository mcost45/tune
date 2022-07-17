import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
	name: 'trackLink'
})
export class TrackLinkPipe implements PipeTransform {
	transform(track?: SpotifyApi.TrackObjectFull | null): string | undefined {
		if (!track) {
			return;
		}

		return track.external_urls.spotify;
	}
}
