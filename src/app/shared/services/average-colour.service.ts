import { Injectable, NgZone } from '@angular/core';
import { FastAverageColor } from 'fast-average-color';
import { from, map, Observable } from 'rxjs';

@Injectable({
	providedIn: 'root'
})
export class AverageColourService {
	private readonly fac = new FastAverageColor();

	constructor(private readonly zone: NgZone) {}

	getAverageImageRgba(image: HTMLImageElement): string {
		return this.zone.runOutsideAngular(() => {
			return this.fac.getColor(image).rgba;
		});
	}

	getAverageImageUrlRgba(url: string): Observable<string> {
		return this.zone.runOutsideAngular(() => {
			return from(this.fac.getColorAsync(url)).pipe(map((result) => result.rgba));
		});
	}
}
