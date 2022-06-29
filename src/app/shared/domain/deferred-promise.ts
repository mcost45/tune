export interface DeferredPromise<T> {
	resolve: (value: PromiseLike<T> | T) => void;
	reject: () => void;
	promise: Promise<T>;
}
