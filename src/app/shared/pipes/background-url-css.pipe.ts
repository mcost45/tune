import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
	name: 'backgroundUrlCss'
})
export class BackgroundUrlCssPipe implements PipeTransform {
	transform(url?: string | null): Record<string, any> | undefined {
		if (!url) {
			return;
		}

		return { backgroundImage: `url(${url})` };
	}
}
