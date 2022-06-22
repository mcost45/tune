import { LogLevel } from './log-level';
import { AuthConfig } from './auth-config';
import { CategoryConfig } from './category-config';
import { PlaybackConfig } from './playback-config';
import { RepositoryConfig } from './repository-config';

export interface AppConfig {
	logLevel: LogLevel;
	auth: AuthConfig;
	repository: RepositoryConfig;
	categories: CategoryConfig;
	playback: PlaybackConfig;
}
