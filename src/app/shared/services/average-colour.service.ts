import { Injectable, NgZone, OnDestroy } from '@angular/core';
import { from, map, NEVER, Observable, ReplaySubject, switchMap, take, takeUntil } from 'rxjs';
import { FastAverageColor, FastAverageColorOptions } from 'fast-average-color';
import { AverageColourWorkerAction } from '../domain/average-colour-worker-action';
import { AverageColourWorkerMessage } from '../domain/average-colour-worker-message';
import { getDeferredPromise } from '../../utility/get-deferred-promise';
import { DeferredPromise } from '../domain/deferred-promise';
import { LogLevel } from '../domain/utility/log-level';
import { LogService } from './utility/log.service';

@Injectable({
	providedIn: 'root'
})
export class AverageColourService implements OnDestroy {
	private static readonly offscreenCanvasUnsupportedMsg =
		'Offscreen canvas is not supported! Failing back to main thread average colour processing.';
	private static readonly offscreenCanvasSupportedMsg =
		'Offscreen canvas is supported on this device.';

	private readonly ongoingTasks = new Map<string, DeferredPromise<string>>();

	private worker?: Worker;
	private fallbackFac?: FastAverageColor;
	private facOptions: FastAverageColorOptions = {
		mode: 'speed',
		algorithm: 'simple'
	};

	private readonly offscreenCanvasSupportedS = new ReplaySubject<boolean>();
	private readonly destroyedS = new ReplaySubject<boolean>(1);

	constructor(private readonly logger: LogService, private readonly zone: NgZone) {
		this.generateWorker();
	}

	ngOnDestroy() {
		this.beginWorkerDestroy();
		this.cleanUpObservables();
	}

	getAverageImageUrlRgba(url: string): Observable<string> {
		return this.zone.runOutsideAngular(() =>
			this.offscreenCanvasSupportedS.pipe(
				take(1),
				switchMap((isSupported) => this.getColourWithFallback(url, isSupported)),
				takeUntil(this.destroyedS)
			)
		);
	}

	private getColourWithFallback(url: string, isSupported: boolean): Observable<string> {
		if (isSupported) {
			return from(this.assignNewPromise(url));
		} else if (this.fallbackFac) {
			return from(this.fallbackFac.getColorAsync(url, this.facOptions)).pipe(
				map((result) => result.hex)
			);
		}
		return NEVER;
	}

	private assignNewPromise(url: string): Promise<string> {
		const deferred = getDeferredPromise<string>();

		const preExisting = this.ongoingTasks.get(url);
		if (preExisting) {
			return preExisting.promise;
		}

		const msg: AverageColourWorkerMessage<[string, FastAverageColorOptions]> = [
			AverageColourWorkerAction.colour,
			url,
			this.facOptions
		];

		this.ongoingTasks.set(url, deferred);
		this.worker?.postMessage(msg);

		return deferred.promise;
	}

	private onMessage(msg: AverageColourWorkerMessage<[(string | boolean)?, string?]>) {
		const [action, mainProp, secondProp] = msg;

		const url = mainProp as string;
		const colour = secondProp as string;

		const offscreenCanvasSupported = mainProp as boolean;

		switch (action) {
			case AverageColourWorkerAction.colour:
				return this.onColourReceived(url, colour);

			case AverageColourWorkerAction.checkedSupported:
				return this.onOffscreenCanvasSupportChecked(offscreenCanvasSupported);

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

	private onOffscreenCanvasSupportChecked(supported: boolean) {
		if (supported) {
			this.logger.log(LogLevel.info, AverageColourService.offscreenCanvasSupportedMsg);
		} else {
			this.fallbackFac = new FastAverageColor();
			this.logger.log(LogLevel.warn, AverageColourService.offscreenCanvasUnsupportedMsg);
		}

		this.offscreenCanvasSupportedS.next(supported);
	}

	private onWorkerDestroyed() {
		const worker = this.worker;

		if (worker) {
			worker.onmessage = null;
			worker.terminate();
		}

		this.fallbackFac?.destroy();
		this.worker = undefined;
	}

	private generateWorker() {
		const msg: AverageColourWorkerMessage<undefined[]> = [
			AverageColourWorkerAction.checkSupported
		];

		const worker = (this.worker = new Worker(
			new URL('../workers/average-colour.worker', import.meta.url)
		));
		worker.onmessage = (event) => this.onMessage(event.data);
		worker.postMessage(msg);
	}

	private beginWorkerDestroy() {
		const msg: AverageColourWorkerMessage<undefined[]> = [AverageColourWorkerAction.destroy];

		this.worker?.postMessage(msg);
	}

	private cleanUpObservables() {
		this.destroyedS.next(true);
		this.destroyedS.complete();
	}
}
