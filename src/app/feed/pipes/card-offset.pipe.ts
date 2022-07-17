import { Pipe, PipeTransform } from '@angular/core';
import { mapRange } from '../../utility/map-range';

@Pipe({
	name: 'cardOffset'
})
export class CardOffsetPipe implements PipeTransform {
	private static readonly offsetPx = 2;

	transform(index?: number | null): Record<string, any> | null {
		if (index === undefined || index === null) {
			return null;
		}
		const variance = mapRange(Math.random(), 0, 1, 0.9, 1.1);
		const amount =
			index > 0 ? (index * CardOffsetPipe.offsetPx * variance) / Math.sqrt(index) : 0;

		return {
			transform: `perspective(none) rotateX(0deg) rotateY(0deg) rotateZ(${amount}deg)`
		};
	}
}
