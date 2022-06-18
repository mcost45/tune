import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
	name: 'backgroundCss'
})
export class BackgroundCssPipe implements PipeTransform {
	transform(value?: string | null): Record<string, any> | undefined {
		if (!value) {
			return;
		}

		return { background: `${value}` };
	}
}
