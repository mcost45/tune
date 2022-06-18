import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
	name: 'cardOffset'
})
export class CardOffsetPipe implements PipeTransform {
	private static readonly offsetPerCardPx = 6;

	transform(index?: number | null): Record<string, any> | undefined {
		if (!index) {
			return;
		}
		const variance = Math.random();
		const translateAmount = index * CardOffsetPipe.offsetPerCardPx + variance;
		const rotateAmount = translateAmount * 0.2;

		return {
			transform: `translate(${translateAmount}px, ${-translateAmount}px) rotateZ(${rotateAmount}deg)`,
			zIndex: `${-index}`
		};
	}
}
