import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
	name: 'cssUrl'
})
export class CssUrlPipe implements PipeTransform {
	transform(value?: string): string | undefined {
		if (!value) {
			return;
		}
		return `url(${value})`;
	}
}
