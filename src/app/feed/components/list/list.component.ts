import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
	selector: 'app-list',
	templateUrl: './list.component.html',
	styleUrls: ['./list.component.scss'],
	changeDetection: ChangeDetectionStrategy.OnPush
})
export class ListComponent {
	private static readonly elementCount = 6;

	activeCards = [];

	private readonly cardQueue = [];

	constructor() {}

	private populateQueue(): void {
		//
	}
}
