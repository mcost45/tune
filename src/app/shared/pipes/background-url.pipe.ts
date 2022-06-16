import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
	name: 'cardOffset'
})
export class CardOffsetPipe implements PipeTransform {
	private static readonly offsetPerCardPx = 6;

	transform(index?: number): Record<string, any> | undefined {
		if (!index) {
			return;
		}
		const amount = (index - 1) * CardOffsetPipe.offsetPerCardPx;
		return { transform: `translate(${amount}px, ${-amount}px)`, zIndex: `${-index}` };
	}
}
