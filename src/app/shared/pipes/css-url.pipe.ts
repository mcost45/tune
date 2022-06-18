import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
	name: 'cssUrl'
})
export class CssUrlPipe implements PipeTransform {
	transform(url?: string | null): string | undefined {
		if (!url) {
			return;
		}
		return `url(${url})`;
	}
}
