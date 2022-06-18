import { Pipe, PipeTransform } from '@angular/core';
import { Observable } from 'rxjs';
import { AverageColourService } from '../services/average-colour.service';

@Pipe({
	name: 'imageColour'
})
export class ImageColourPipe implements PipeTransform {
	constructor(private readonly averageColourService: AverageColourService) {}

	transform(image?: string | HTMLImageElement | null): string | Observable<string> | undefined {
		if (!image) {
			return;
		}

		if (typeof image === 'string') {
			return this.averageColourService.getAverageImageUrlHex(image);
		} else {
			return this.averageColourService.getAverageImageHex(image);
		}
	}
}
