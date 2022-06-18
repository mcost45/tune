import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
	name: 'artistImage'
})
export class ArtistImagePipe implements PipeTransform {
	transform(artist?: SpotifyApi.ArtistObjectFull | null): string | undefined {
		if (!artist) {
			return;
		}

		return artist.images[0]?.url;
	}
}
