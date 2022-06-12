export interface AuthConfig {
	clientId: string;
	relRedirectUri: string;
	spotifyAuthUri: string;
	spotifyTokenUri: string;
	scope: string;
	codeLen: number;
	postSuccessRoute: string;
	postFailedRoute: string;
	postLogoutRoute: string;
}
