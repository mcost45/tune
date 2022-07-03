interface ErrorWithMessage {
	message: string;
}

interface ErrorWithStack extends ErrorWithMessage {
	stack: string;
}

const errorHasMessage = (e: unknown): e is ErrorWithMessage => {
	return (
		typeof e === 'object' &&
		e !== null &&
		'message' in e &&
		typeof (e as Record<string, unknown>).message === 'string'
	);
};

const errorHasStack = (e: ErrorWithMessage): e is ErrorWithStack => {
	return (
		'stack' in e && typeof (e as ErrorWithMessage & Record<string, unknown>).stack === 'string'
	);
};

export const unknownErrorToString = (e: unknown): string => {
	if (errorHasMessage(e)) {
		let out = e.message;
		if (errorHasStack(e)) {
			out += `\n${e.stack}`;
		}

		return out;
	}

	try {
		return JSON.stringify(e);
	} catch {
		return String(e);
	}
};
