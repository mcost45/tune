export const urlToBitmap = async (url: string): Promise<ImageBitmap> => {
	const response = await fetch(url);
	const blob = await response.blob();
	return createImageBitmap(blob);
};
