import { Pipe, PipeTransform } from '@angular/core';
import { Observable } from 'rxjs';
import { AverageColourService } from '../services/average-colour.service';

@Pipe({
	name: 'imageColourElement'
})
export class ImageColourElementPipe implements PipeTransform {
	constructor(private readonly averageColourService: AverageColourService) {}

	transform(image?: HTMLImageElement | null): string | Observable<string> | undefined {
		if (!image) {
			return;
		}

		return this.averageColourService.getAverageImageHex(image);
	}
}
