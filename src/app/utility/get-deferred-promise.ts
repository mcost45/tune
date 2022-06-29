import { DeferredPromise } from '../shared/domain/deferred-promise';

export const getDeferredPromise = <T>(): DeferredPromise<T> => {
	let resolve!: (value: PromiseLike<T> | T) => void;
	let reject!: () => void;

	const promise = new Promise<T>((res, rej) => {
		resolve = res;
		reject = rej;
	});

	return { promise, resolve, reject };
};
