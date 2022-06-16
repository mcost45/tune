import { Injectable } from '@angular/core';
import { RouterStateSnapshot, TitleStrategy } from '@angular/router';
import { Title } from '@angular/platform-browser';
import { TranslateService } from '@ngx-translate/core';

@Injectable()
export class AppTitleStrategy extends TitleStrategy {
	constructor(
		private readonly title: Title,
		private readonly translateService: TranslateService
	) {
		super();
	}

	override updateTitle(routerState: RouterStateSnapshot) {
		const prefix = this.translateService.instant('APP.TITLE');
		const separator = ' - ';
		let suffix = '';

		const builtTitle = this.buildTitle(routerState);
		if (builtTitle) {
			suffix = `${separator}${this.titleCase(this.translateService.instant(builtTitle))}`;
		}

		this.title.setTitle(`${prefix}${suffix}`);
	}

	private titleCase(value: string, locale = navigator.language): string {
		return value
			.toLowerCase()
			.split(' ')
			.map(
				([firstChar, ...restChars]) =>
					firstChar.toLocaleUpperCase(locale) + restChars.join('')
			)
			.join(' ');
	}
}
