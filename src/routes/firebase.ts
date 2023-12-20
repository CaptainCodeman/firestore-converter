import { initializeApp } from 'firebase/app'
import {
  PUBLIC_API_KEY,
  PUBLIC_AUTH_DOMAIN,
  PUBLIC_DATABASE_URL,
  PUBLIC_PROJECT_ID,
  PUBLIC_STORAGE_BUCKET,
  PUBLIC_MESSAGE_SENDER_ID,
  PUBLIC_APP_ID,
  PUBLIC_MEASUREMENT_ID,
} from '$env/static/public'
import { getFirestore, collection, doc, getDoc, setDoc, getDocs } from 'firebase/firestore'
import { PersonConverter, type Person } from './person'
import { converter, DefaultConverter } from 'firestore-converter/firebase'

export const app = initializeApp({
  apiKey: PUBLIC_API_KEY,
  authDomain: PUBLIC_AUTH_DOMAIN,
  databaseURL: PUBLIC_DATABASE_URL,
  projectId: PUBLIC_PROJECT_ID,
  storageBucket: PUBLIC_STORAGE_BUCKET,
  messagingSenderId: PUBLIC_MESSAGE_SENDER_ID,
  appId: PUBLIC_APP_ID,
  measurementId: PUBLIC_MEASUREMENT_ID,
})

export const firestore = getFirestore(app)

// const personConverter = new PersonConverter(converter)

type Prettify<T> = {
  [K in keyof T]: T[K];
} & {};

const personConverter: Prettify<DefaultConverter<Person>> = new DefaultConverter<Person>()

export async function getPeople() {
  const col = collection(firestore, 'people').withConverter(personConverter)
  const snap = await getDocs(col)
  const people = snap.docs.map(doc => doc.data())
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