import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
	name: 'backgroundUrlStyle'
})
export class BackgroundUrlStylePipe implements PipeTransform {
	private static readonly offsetPerCardPx = 6;

	transform(url?: string | null): Record<string, any> | undefined {
		if (!url) {
			return;
		}

		return { backgroundImage: `url(${url})` };
	}
}
