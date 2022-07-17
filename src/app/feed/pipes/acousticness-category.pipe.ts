import { Pipe, PipeTransform } from '@angular/core';
import { ConfigService } from '../../shared/services/utility/config.service';

@Pipe({
	name: 'acousticnessCategory'
})
export class AcousticnessCategoryPipe implements PipeTransform {
	constructor(private readonly configService: ConfigService) {}

	transform(acousticness?: number | null): string | undefined {
		const config = this.configService.config.categories.acousticness;
		if (acousticness === undefined || acousticness === null) {
			return;
		}

		if (acousticness > config.max) {
			return 'CATEGORIES.ACOUSTIC';
		}
	}
}
