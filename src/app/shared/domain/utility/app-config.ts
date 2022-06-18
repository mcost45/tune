import { LogLevel } from './log-level';
import { AuthConfig } from './auth-config';

export interface AppConfig {
	logLevel: LogLevel;
	auth: AuthConfig;
}
