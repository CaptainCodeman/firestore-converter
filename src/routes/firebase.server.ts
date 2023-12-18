import { cert, initializeApp } from 'firebase-admin/app'
import { SERVICE_ACCOUNT_FILE } from '$env/static/private'
import { getFirestore } from 'firebase-admin/firestore'
import { PersonConverter, type Person } from './person'
import { converter } from 'firestore-converter/firebase.server'

export const app = initializeApp({ credential: cert(SERVICE_ACCOUNT_FILE) })

export const firestore = getFirestore(app)

const personConverter = new PersonConverter(converter)

export async function getPeople() {
  const col = firestore.collection('people').withConverter(personConverter)
  const snap = await col.get()
  const people = snap.docs.map(doc => doc.data())
  return people
}

export async function getPerson(id: string) {
  const snap = await firestore.collection('people').doc(id).withConverter(personConverter).get()
  const person = snap.data()
  return person
}

export async function setPerson(person: Person) {
  const ref = firestore.collection('people').doc(person.id).withConverter(personConverter)
  await ref.set(person)
}