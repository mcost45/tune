import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
	name: 'reverseList'
})
export class ReverseListPipe implements PipeTransform {
	transform<T>(list?: T[] | null): T[] | null {
		if (!list) {
			return null;
		}

		const len = list.length;
		const out = new Array(len);

		let i = len;
		let j = 0;

		while (i--) {
			out[i] = list[j++];
		}

		return out;
	}
}
