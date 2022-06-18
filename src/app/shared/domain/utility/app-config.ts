import { LogLevel } from './log-level';
import { AuthConfig } from './auth-config';
import { CategoryConfig } from './category-config';
import { PlaybackConfig } from './playback-config';

export interface AppConfig {
	logLevel: LogLevel;
	auth: AuthConfig;
	categories: CategoryConfig;
	playback: PlaybackConfig;
}
