import { Pipe, PipeTransform } from '@angular/core';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';

@Pipe({
	name: 'sanitizeResourceUrl'
})
export class SanitizeResourceUrlPipe implements PipeTransform {
	constructor(private readonly domSanitizer: DomSanitizer) {}

	transform(url?: string | null): SafeResourceUrl | undefined {
		if (!url) {
			return;
		}

		return this.domSanitizer.bypassSecurityTrustResourceUrl(url);
	}
}
