import { Pipe, PipeTransform } from '@angular/core';
import { ConfigService } from '../../../shared/services/utility/config.service';

@Pipe({
	name: 'danceabilityCategory'
})
export class DanceabilityCategoryPipe implements PipeTransform {
	constructor(private readonly configService: ConfigService) {}

	transform(danceability?: number | null): string | undefined {
		const config = this.configService.config.categories.danceability;
		if (danceability === undefined || danceability === null) {
			return;
		}

		if (danceability > config.max) {
			return 'CATEGORIES.GROOVY';
		} else if (danceability < config.min) {
			return 'CATEGORIES.SLOW_DANCE';
		}
	}
}
