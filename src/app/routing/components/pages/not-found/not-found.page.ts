import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
	selector: 'app-not-found',
	templateUrl: './not-found.page.html',
	styleUrls: ['./not-found.page.scss'],
	changeDetection: ChangeDetectionStrategy.OnPush
})
export class NotFoundPage {}
