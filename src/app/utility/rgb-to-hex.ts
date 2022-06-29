const toHex = (c: number): string => {
	const hex = c.toString(16);
	return hex.length === 1 ? '0' + hex : hex;
};

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export const rgbToHex = ([r, g, b, ...rest]: [number, number, number, ...[number]]): string => {
	return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
};
