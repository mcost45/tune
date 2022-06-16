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
export class HasInteractedService implements OnDestroy {
	private static readonly waitForEvent = ['click', 'scroll', 'mouseup', 'mousedown'];

	private readonly destroyedS = new ReplaySubject(1);
	private readonly interactedS = new BehaviorSubject(false);
	private readonly interacted$ = this.interactedS.asObservable();

	constructor(private readonly zone: NgZone) {
		this.zone.runOutsideAngular(() => {
			merge(...HasInteractedService.waitForEvent.map((e) => fromEvent(document, e)))
				.pipe(take(1), runInZone(this.zone), takeUntil(this.destroyedS))
				.subscribe(() => this.interactedS.next(true));
		});
	}

	get hasInteracted$(): Observable<boolean> {
		return this.interacted$;
	}

	ngOnDestroy() {
		this.destroyedS.next(true);
		this.destroyedS.complete();
	}
}
