import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
	name: 'backgroundUrlCss'
})
export class BackgroundUrlCssPipe implements PipeTransform {
	private static readonly offsetPerCardPx = 6;

	transform(url?: string | null): Record<string, any> | undefined {
		if (!url) {
			return;
		}

		return { backgroundImage: `url(${url})` };
	}
}
