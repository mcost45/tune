/// <reference lib="webworker" />

import { FastAverageColor, FastAverageColorOptions } from 'fast-average-color';
import { AverageColourWorkerMessage } from '../domain/average-colour-worker-message';
import { AverageColourWorkerAction } from '../domain/average-colour-worker-action';
import { bitmapToArray } from '../../utility/bitmap-to-array-offscreen';
import { urlToBitmap } from '../../utility/url-to-bitmap';
import { rgbToHex } from '../../utility/rgb-to-hex';

const fac = new FastAverageColor();
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

const onMessage = (
	msg: AverageColourWorkerMessage<[string?, (string | FastAverageColorOptions)?]>
) => {
	const [action, url, options] = msg;

	switch (action) {
		case AverageColourWorkerAction.colour:
			return onUrlReceived(url, options as FastAverageColorOptions);

		case AverageColourWorkerAction.checkSupported:
			return onCheckSupportedReceieved();

		case AverageColourWorkerAction.destroy:
			return onDestroyReceived();
	}
};

const onUrlReceived = (url?: string, options?: FastAverageColorOptions) => {
	if (!url) {
		return;
	}

	try {
		urlToBitmap(url).then((bitmap) => {
			if (!context) {
				return postMessage(colourMsgIfFailed(url));
			}

			const array = bitmapToArray(context, bitmap);
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

const onCheckSupportedReceieved = () => {
	const offscreenCanvasIsSupported = !!canvas && !!context;
	const msg: AverageColourWorkerMessage<boolean[]> = [
		AverageColourWorkerAction.checkedSupported,
		offscreenCanvasIsSupported
	];

	postMessage(msg);
};

const onDestroyReceived = () => {
	const msg: AverageColourWorkerMessage<undefined[]> = [AverageColourWorkerAction.destroyed];

	fac.destroy();
	postMessage(msg);
};
