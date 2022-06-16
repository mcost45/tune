import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
	name: 'cssUrl'
})
export class CssUrlPipe implements PipeTransform {
	transform(value?: string | null): string | undefined {
		if (!value) {
			return;
		}
		return `url(${value})`;
	}
}
