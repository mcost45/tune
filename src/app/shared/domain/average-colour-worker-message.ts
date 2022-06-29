import { AverageColourWorkerAction } from './average-colour-worker-action';

export type AverageColourWorkerMessage<T extends Array<unknown>> = [
	AverageColourWorkerAction,
	...T
];
