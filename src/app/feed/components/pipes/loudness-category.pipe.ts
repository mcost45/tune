import { Pipe, PipeTransform } from '@angular/core';
import { ConfigService } from '../../../shared/services/utility/config.service';

@Pipe({
	name: 'popularityCategory'
})
export class PopularityCategoryPipe implements PipeTransform {
	constructor(private readonly configService: ConfigService) {}

	transform(energy?: number | null): string | undefined {
		const config = this.configService.config.categories.energy;
		if (energy === undefined || energy === null) {
			return;
		}

		if (energy > config.max) {
			return 'CATEGORIES.HIGH_ENERGY';
		} else if (energy < config.min) {
			return 'CATEGORIES.RELAXED';
		}
	}
}
