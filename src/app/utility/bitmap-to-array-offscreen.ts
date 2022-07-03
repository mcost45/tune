// TS types involving OffscreenRenderingContext2D don't seem to be fully developed yet
export const bitmapToArray = (context: any, bitmap: ImageBitmap): Uint8ClampedArray | undefined => {
	const { width, height } = bitmap;
	context.drawImage(bitmap, 0, 0, width, height);
	const imageData = context.getImageData(0, 0, width, height);
	return imageData?.data;
};
