import { getPeople } from './firebase.server';

export async function load() {
	const people = await getPeople();

	return {
		people
	};
}
