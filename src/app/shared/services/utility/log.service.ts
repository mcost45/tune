import { Injectable } from '@angular/core';
import { LogLevel } from '../../../domain/utility/log-level';
import { ConfigService } from './config.service';

@Injectable({
	providedIn: 'root'
})
// Performs simple logging.
export class LogService {
	private static levelToLogCall: Map<LogLevel, (output: string) => void> = new Map([
		[LogLevel.error, console.error],
		[LogLevel.warn, console.warn],
		[LogLevel.info, console.log],
		[LogLevel.trace, console.log]
	]);

	private logToLevel: number | undefined;

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
		if (logLevel && level > logLevel) {
			return;
		}

		const output = LogService.generateOutput(level, message);
		const logCall = LogService.levelToLogCall.get(level) as (output: string) => void;

		logCall(output);
	}
}
