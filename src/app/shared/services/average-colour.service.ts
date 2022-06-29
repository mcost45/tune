import { Injectable, NgZone, OnDestroy } from '@angular/core';
import { from, Observable } from 'rxjs';
import { AverageColourWorkerAction } from '../domain/average-colour-worker-action';
import { AverageColourWorkerMessage } from '../domain/average-colour-worker-message';
import { getDeferredPromise } from '../../utility/get-deferred-promise';
import { DeferredPromise } from '../domain/deferred-promise';

@Injectable({
	providedIn: 'root'
})
export class AverageColourService implements OnDestroy {
	private readonly ongoingTasks = new Map<string, DeferredPromise<string>>();
	private worker?: Worker;

	constructor(private readonly zone: NgZone) {
		this.generateWorker();
	}

	ngOnDestroy() {
		this.beginWorkerDestroy();
	}

	getAverageImageUrlRgba(url: string): Observable<string> {
		return this.zone.runOutsideAngular(() => from(this.assignNewPromise(url)));
	}

	private assignNewPromise(url: string): Promise<string> {
		const deferred = getDeferredPromise<string>();

		const preExisting = this.ongoingTasks.get(url);
		if (preExisting) {
			return preExisting.promise;
		}

		const msg: AverageColourWorkerMessage<[string]> = [AverageColourWorkerAction.colour, url];

		this.ongoingTasks.set(url, deferred);
		this.worker?.postMessage(msg);

		return deferred.promise;
	}

	private onMessage(msg: AverageColourWorkerMessage<[string?, string?]>) {
		const [action, url, colour] = msg;

		switch (action) {
			case AverageColourWorkerAction.colour:
				return this.onColourReceived(url, colour);

			case AverageColourWorkerAction.destroyed:
				return this.onWorkerDestroyed();
		}
	}

	private onColourReceived(url?: string, colour?: string) {
		if (!url || !colour) {
			return;
		}

		const deferred = this.ongoingTasks.get(url);
		if (deferred) {
			this.ongoingTasks.delete(url);
			deferred.resolve(colour);
		}
	}

	private onWorkerDestroyed() {
		const worker = this.worker;

		if (worker) {
			worker.onmessage = null;
			worker.terminate();
		}

		this.worker = undefined;
	}

	private generateWorker() {
		this.worker = new Worker(new URL('../workers/average-colour.worker', import.meta.url));
		this.worker.onmessage = (event) => this.onMessage(event.data);
	}

	private beginWorkerDestroy() {
		const msg: AverageColourWorkerMessage<undefined[]> = [AverageColourWorkerAction.destroy];

		this.worker?.postMessage(msg);
	}
}
