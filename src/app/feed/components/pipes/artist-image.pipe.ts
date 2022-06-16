import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
	name: 'artistNames'
})
export class ArtistNamesPipe implements PipeTransform {
	transform(value?: SpotifyApi.ArtistObjectSimplified[]): string[] | undefined {
		if (!value) {
			return;
		}

		const len = value.length;
		const out = new Array(len);

		for (let i = 0; i < len; i++) {
			out[i] = value[i].name;
		}

		return out;
	}
}
