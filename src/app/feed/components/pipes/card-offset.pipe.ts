import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
	name: 'artistImage'
})
export class ArtistImagePipe implements PipeTransform {
	transform(value?: SpotifyApi.ArtistObjectFull): string | undefined {
		if (!value) {
			return;
		}

		return value.images[0].url;
	}
}
