export interface CategoryConfig {
	popularity: {
		min: number;
		max: number;
	};
	danceability: {
		min: number;
		max: number;
	};
	energy: {
		min: number;
		max: number;
	};
	liveness: {
		max: number;
	};
	loudness: {
		min: number;
		max: number;
	};
	acousticness: {
		max: number;
	};
}
