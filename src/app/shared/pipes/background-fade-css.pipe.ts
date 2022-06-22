import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
	name: 'backgroundFadeCss'
})
export class BackgroundFadeCssPipe implements PipeTransform {
	transform(
		value?: string | null,
		strengthPercentage: number = 50,
		degrees = 0
	): Record<string, any> | null {
		if (!value) {
			return null;
		}

		return {
			backgroundImage: `linear-gradient(${degrees}deg, ${value} ${strengthPercentage}%, rgba(255,0,0,0))`
		};
	}
}
