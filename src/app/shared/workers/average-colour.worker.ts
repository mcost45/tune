/// <reference lib="webworker" />

import { FastAverageColor, FastAverageColorOptions } from 'fast-average-color';
import { AverageColourWorkerMessage } from '../domain/average-colour-worker-message';
import { AverageColourWorkerAction } from '../domain/average-colour-worker-action';
import { bitmapToArray, Context } from '../../utility/bitmap-to-array';
import { urlToBitmap } from '../../utility/url-to-bitmap';
import { rgbToHex } from '../../utility/rgb-to-hex';

const fac = new FastAverageColor();
const options: FastAverageColorOptions = {
	mode: 'speed',
	algorithm: 'simple'
};
const colourIfFailedHex = '#1c1c1d';
const colourMsgIfFailed = (url: string): AverageColourWorkerMessage<[string, string]> => [
	AverageColourWorkerAction.colour,
	url,
	colourIfFailedHex
];

const canvasDims = 1200;
// eslint-disable-next-line deprecation/deprecation
let canvas: OffscreenCanvas | undefined;
let context: OffscreenCanvasRenderingContext2D | null | undefined;

try {
	canvas = new OffscreenCanvas(canvasDims, canvasDims);
	context = canvas.getContext('2d', { alpha: true, desynchronized: true });
} catch (e) {
	console.error(e);
}

addEventListener('message', (event) => onMessage(event.data));

const onMessage = (msg: AverageColourWorkerMessage<[string?, string?]>) => {
	const [action, url] = msg;

	switch (action) {
		case AverageColourWorkerAction.colour:
			return onUrlReceived(url);

		case AverageColourWorkerAction.destroy:
			return onDestroyReceived();
	}
};

const onUrlReceived = (url?: string) => {
	if (!url) {
		return;
	}

	if (!context) {
		return postMessage(colourMsgIfFailed(url));
	}

	try {
		urlToBitmap(url).then((bitmap) => {
			// Note: Necessary for weird TS error on context types.
			const array = bitmapToArray(context as unknown as Context, bitmap);
			if (!array) {
				return postMessage(colourMsgIfFailed(url));
			}

			const result = fac.getColorFromArray4(array, options);
			const hex = rgbToHex(result);
			const msg: AverageColourWorkerMessage<[string, string]> = [
				AverageColourWorkerAction.colour,
				url,
				hex
			];

			postMessage(msg);
		});
	} catch (e) {
		return postMessage(colourMsgIfFailed(url));
	}
};

const onDestroyReceived = () => {
	const msg: AverageColourWorkerMessage<undefined[]> = [AverageColourWorkerAction.destroyed];

	fac.destroy();
	postMessage(msg);
};
