export const waitFrame = (): Promise<number> => {
	return new Promise((resolve) => requestAnimationFrame(resolve));
};
