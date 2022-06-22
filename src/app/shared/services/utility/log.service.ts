import { ErrorHandler, Injectable } from '@angular/core';
import { LogLevel } from '../../domain/utility/log-level';
import { ConfigService } from './config.service';

@Injectable({
	providedIn: 'root'
})
// Performs simple logging.
export class LogService implements ErrorHandler {
	private static readonly unknownClientError = 'An unknown client error occurred.';

	/* eslint-disable no-console */
	private static levelToLogCall: Map<LogLevel, (output: string) => void> = new Map([
		[LogLevel.error, console.error],
		[LogLevel.warn, console.warn],
		[LogLevel.info, console.info],
		[LogLevel.trace, console.info]
	]);
	/* eslint-enable no-console */

	private logToLevel = LogLevel.disabled;

	constructor(private readonly configService: ConfigService) {}

	private static generateOutput(level: LogLevel, message: string): string {
		return `[${LogLevel[level]}] ${message}`;
	}

	init() {
		this.logToLevel = this.configService.config.logLevel;

		this.log(
			LogLevel.info,
			`Initialised Logger with min level '${LogLevel[this.logToLevel]}.'`
		);
	}

	log(level: LogLevel, message: string) {
		const logLevel = this.logToLevel;
		if (logLevel !== undefined && level > logLevel) {
			return;
		}

		const output = LogService.generateOutput(level, message);
		const logCall = LogService.levelToLogCall.get(level) as (output: string) => void;

		logCall(output);
	}

	handleError(error: any) {
		this.log(LogLevel.error, this.mapErrorToMessage(error));
	}

	private mapErrorToMessage(error: any): string {
		let out = '';

		if (error?.rejection) {
			out += error.rejection;
		}

		if (error?.message) {
			out += `\n${error.message}`;
		}

		if (error?.stack) {
			out += `\n${error.stack}`;
		}

		if (out.length) {
			return out;
		}

		return LogService.unknownClientError;
	}
}
