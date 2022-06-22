import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
	name: 'backgroundUrlCss'
})
export class BackgroundUrlCssPipe implements PipeTransform {
	transform(url?: string | null): Record<string, any> | null {
		if (!url) {
			return null;
		}

		return { backgroundImage: `url(${url})` };
	}
}
