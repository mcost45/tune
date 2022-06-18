import { Pipe, PipeTransform } from '@angular/core';
import { AverageColourService } from '../services/average-colour.service';

@Pipe({
	name: 'imageColourElement'
})
export class ImageColourElementPipe implements PipeTransform {
	constructor(private readonly averageColourService: AverageColourService) {}

	transform(image?: HTMLImageElement | null): string | undefined {
		if (!image) {
			return;
		}

		return this.averageColourService.getAverageImageRgba(image);
	}
}
