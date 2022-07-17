import { Pipe, PipeTransform } from '@angular/core';
import { ConfigService } from '../../shared/services/utility/config.service';

@Pipe({
	name: 'popularityCategory'
})
export class PopularityCategoryPipe implements PipeTransform {
	constructor(private readonly configService: ConfigService) {}

	transform(popularity?: number | null): string | undefined {
		const config = this.configService.config.categories.popularity;
		if (popularity === undefined || popularity === null) {
			return;
		}

		if (popularity > config.max) {
			return 'CATEGORIES.HOT';
		} else if (popularity < config.min) {
			return 'CATEGORIES.HIDDEN_GEM';
		}
	}
}
