export const getRandomItems = <T>(arr: T[], n: number): T[] => {
	const result = new Array(n);
	let len = arr.length;
	const selected = new Array(len);
	n = Math.min(n, len);

	while (n--) {
		const x = Math.floor(Math.random() * len);
		result[n] = arr[x in selected ? selected[x] : x];
		selected[x] = --len in selected ? selected[len] : len;
	}

	return result;
};
