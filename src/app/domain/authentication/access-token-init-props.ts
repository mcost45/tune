export interface AccessTokenInitProps {
	clientId: string;
	grantType: string;
	code: string;
	redirectUri: string;
	codeVerifier: string;
}
