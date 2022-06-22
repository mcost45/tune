import { Injectable, NgZone, OnDestroy } from '@angular/core';
import {
	BehaviorSubject,
	fromEvent,
	merge,
	Observable,
	ReplaySubject,
	take,
	takeUntil
} from 'rxjs';
import { runInZone } from '../../utility/run-in-zone';

@Injectable({
	providedIn: 'root'
})
export class InteractedService implements OnDestroy {
	private static readonly waitForEvent = ['click', 'scroll', 'mousedown'];

	private readonly destroyedS = new ReplaySubject(1);
	private readonly interactedS = new BehaviorSubject(false);
	private readonly interacted$ = this.interactedS.asObservable();

	constructor(private readonly zone: NgZone) {}

	get hasInteracted$(): Observable<boolean> {
		return this.interacted$;
	}

	init() {
		this.zone.runOutsideAngular(() => {
			merge(...InteractedService.waitForEvent.map((e) => fromEvent(document, e)))
				.pipe(take(1), runInZone(this.zone), takeUntil(this.destroyedS))
				.subscribe(() => this.interactedS.next(true));
		});
	}

	ngOnDestroy() {
		this.destroyedS.next(true);
		this.destroyedS.complete();
	}
}
