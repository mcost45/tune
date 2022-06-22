import { ChangeDetectionStrategy, Component } from '@angular/core';
import { Router } from '@angular/router';

@Component({
	selector: 'app-home',
	templateUrl: 'home.page.html',
	styleUrls: ['home.page.scss'],
	changeDetection: ChangeDetectionStrategy.OnPush
})
export class HomePage {
	constructor(private readonly router: Router) {}

	async onOpenFeed(): Promise<void> {
		await this.router.navigateByUrl('/feed');
	}
}
