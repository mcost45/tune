import { NgZone } from '@angular/core';
import { Observable, OperatorFunction } from 'rxjs';

export const runOutsideZone = <T>(zone: NgZone): OperatorFunction<T, T> => {
	return (source) => {
		return new Observable((observer) => {
			const next = (value: T) => zone.runOutsideAngular(() => observer.next(value));
			const error = (e: any) => zone.runOutsideAngular(() => observer.error(e));
			const complete = () => zone.runOutsideAngular(() => observer.complete());
			return source.subscribe({ next, error, complete });
		});
	};
};
