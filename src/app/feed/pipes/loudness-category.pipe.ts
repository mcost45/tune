import { Pipe, PipeTransform } from '@angular/core';
import { ConfigService } from '../../shared/services/utility/config.service';

@Pipe({
	name: 'loudnessCategory'
})
export class LoudnessCategoryPipe implements PipeTransform {
	constructor(private readonly configService: ConfigService) {}

	transform(loudness?: number | null): string | undefined {
		const config = this.configService.config.categories.loudness;
		if (loudness === undefined || loudness === null) {
			return;
		}

		if (loudness > config.max) {
			return 'CATEGORIES.LOUD';
		} else if (loudness < config.min) {
			return 'CATEGORIES.QUIET';
		}
	}
}
