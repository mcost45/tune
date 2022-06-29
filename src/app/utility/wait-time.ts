export const waitTime = (delayMs: number): Promise<void> => {
	return new Promise((resolve) => setTimeout(resolve, delayMs));
};
