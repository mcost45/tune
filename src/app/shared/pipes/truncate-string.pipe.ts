import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
	name: 'truncateString'
})
export class TruncateStringPipe implements PipeTransform {
	transform(value?: string | null, length?: number): string | undefined {
		if (!value) {
			return;
		}

		if (!length) {
			return value;
		}

		const currentLen = value.length;
		if (currentLen < length) {
			return value;
		}

		return value.substring(0, length).trimEnd() + '...';
	}
}
