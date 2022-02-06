import { TokenSetKeys } from './token-set-keys';

export interface TokenSetProps {
	[TokenSetKeys.accessToken]: string;
	[TokenSetKeys.refreshToken]: string;
	[TokenSetKeys.expiresAt]: number;
	[TokenSetKeys.expiresIn]: number;
}
