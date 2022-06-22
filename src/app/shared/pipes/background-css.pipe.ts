import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
	name: 'backgroundCss'
})
export class BackgroundCssPipe implements PipeTransform {
	transform(value?: string | null): Record<string, any> | null {
		if (!value) {
			return null;
		}

		return { backgroundImage: `${value}` };
	}
}
