import { getPeople, setPerson } from './firebase.server'
import { readFileSync } from 'fs'

export async function load() {
	const photo = readFileSync('src/routes/captaincodeman.jpg').toString('base64')
	await setPerson({
		id: 'captain-codeman',
		name: 'CaptainCodeman',
		dob: new Date(1970, 0, 1),
		photo,
	})

	const people = await getPeople()

	return {
		people,
	}
}
