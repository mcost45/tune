import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
	name: 'commaJoin'
})
export class CommaJoinPipe implements PipeTransform {
	transform(value?: string[]): string | undefined {
		if (!value) {
			return;
		}
		return value.join(', ');
	}
}
