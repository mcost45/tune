import { Injectable } from '@angular/core';
import { RouterStateSnapshot, TitleStrategy } from '@angular/router';
import { Title } from '@angular/platform-browser';
import { TranslateService } from '@ngx-translate/core';

@Injectable({
	providedIn: 'root'
})
export class AppTitleStrategyService extends TitleStrategy {
	private readonly separator = ' - ';

	constructor(
		private readonly title: Title,
		private readonly translateService: TranslateService
	) {
		super();
	}

	override updateTitle(routerState: RouterStateSnapshot) {
		const prefix = this.translateService.instant('APP.TITLE');
		let suffix = '';

		const builtTitle = this.buildTitle(routerState);
		if (builtTitle) {
			suffix = `${this.separator}${this.ensureTitleCase(
				this.translateService.instant(builtTitle)
			)}`;
		}

		this.title.setTitle(`${prefix}${suffix}`);
	}

	modifySubTitle(key: string, translate = true, ensureTitleCase = true): void {
		const rootTitle = this.translateService.instant('APP.TITLE');
		const useValue = translate ? this.translateService.instant(key) : key;
		const subTitle = `${this.separator}${
			ensureTitleCase ? this.ensureTitleCase(useValue) : useValue
		}`;

		this.title.setTitle(`${rootTitle}${subTitle}`);
	}

	private ensureTitleCase(value: string, locale = navigator.language): string {
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
