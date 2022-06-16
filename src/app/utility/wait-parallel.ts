export const waitParallel = <T extends readonly PromiseLike<unknown>[]>(
	...promises: T
): Promise<{ [P in keyof T]: Awaited<T[P]> }> => {
	return Promise.all(promises);
};
