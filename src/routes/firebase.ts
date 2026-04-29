import { initializeApp } from 'firebase/app'
import {
	getFirestore,
	collection,
	doc,
	getDoc,
	setDoc,
	getDocs,
	connectFirestoreEmulator,
} from 'firebase/firestore'
import { PersonConverter, type Person } from './person'
import { createConverter } from 'firestore-converter/firebase'

const app = initializeApp({ projectId: 'demo-converter' })

const firestore = getFirestore(app)

connectFirestoreEmulator(firestore, 'localhost', 8080)

// examples of creating and using an instance of PersonConverter from the firebase client-side SDK

const personConverter = createConverter(PersonConverter)

export async function getPeople() {
	const col = collection(firestore, 'people').withConverter(personConverter)
	const snap = await getDocs(col)
	const people = snap.docs.map((doc) => doc.data())
	return people
}

export async function getPerson(id: string) {
	const col = collection(firestore, 'people')
	const ref = doc(col, id).withConverter(personConverter)
	const snap = await getDoc(ref)
	const person = snap.data()
	return person
}

export async function setPerson(person: Person) {
	const col = collection(firestore, 'people')
	const ref = doc(col, person.id).withConverter(personConverter)
	await setDoc(ref, person)
}
