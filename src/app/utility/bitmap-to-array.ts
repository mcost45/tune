export interface Context {
	drawImage: (image: CanvasImageSource, sx: number, sy: number, sw: number, sh: number) => void;
	getImageData: (x: number, y: number, width: number, height: number) => ImageData;
}

export const bitmapToArray = (
	context: Context,
	bitmap: ImageBitmap
): Uint8ClampedArray | undefined => {
	const { width, height } = bitmap;
	context.drawImage(bitmap, 0, 0, width, height);
	const imageData = context.getImageData(0, 0, width, height);
	return imageData?.data;
};
