import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
	name: 'commaJoin'
})
export class CommaJoinPipe implements PipeTransform {
	transform(strings?: string[] | null): string | undefined {
		if (!strings) {
			return;
		}
		return strings.join(', ');
	}
}
