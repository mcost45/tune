import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
	name: 'trackImage'
})
export class TrackImagePipe implements PipeTransform {
	transform(track?: SpotifyApi.TrackObjectFull | null): string | undefined {
		if (!track) {
			return;
		}

		return track.album.images[0]?.url;
	}
}
