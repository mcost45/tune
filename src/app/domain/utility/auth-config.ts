export interface AuthConfig {
	clientId: string;
	relRedirectUri: string;
	spotifyAuthUri: string;
	spotifyTokenUri: string;
	scope: string;
	codeLen: number;
}
