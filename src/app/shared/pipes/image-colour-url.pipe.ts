import { Pipe, PipeTransform } from '@angular/core';
import { Observable } from 'rxjs';
import { AverageColourService } from '../services/average-colour.service';

@Pipe({
	name: 'imageColourUrl'
})
export class ImageColourUrlPipe implements PipeTransform {
	constructor(private readonly averageColourService: AverageColourService) {}

	transform(image?: string | null): Observable<string> | undefined {
		if (!image) {
			return;
		}

		return this.averageColourService.getAverageImageUrlRgba(image);
	}
}
