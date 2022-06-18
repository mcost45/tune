import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
	name: 'artistNames'
})
export class ArtistNamesPipe implements PipeTransform {
	transform(artists?: SpotifyApi.ArtistObjectSimplified[] | null): string[] | undefined {
		if (!artists) {
			return;
		}

		const len = artists.length;
		const out = new Array(len);

		for (let i = 0; i < len; i++) {
			out[i] = artists[i].name;
		}

		return out;
	}
}
