# firestore-converter

Google Firestore has a cool and useful ['data converter' system](https://firebase.google.com/docs/reference/js/firestore_.firestoredataconverter?hl=en) that provides a way to define transforms to be used to translate entities between the version persisted to the Firestore database and your in-memory object model of it.

Unfortunately, it also has both a client-side `firebase` SDK and a server-side `firebase-admin` SDK, which of course have incompatible `FirestoreDataConverter` interfaces for defining these transforms. This makes defining them awkward.

Instead of using the `Uint8Array` for binary data on both the server and client, the SDKs use `Buffer` on the server and a custom `Bytes` object on the client. Both require separate handling.

Dates fare a little better, in that they both use a `Timestamp` field, but you need to translate between regular JavaScript Date objects (couldn't they have been used, and an extra property added to enable round-tripping with the increased precision?)

Anyway, the point is that the Firestore Data Converter _idea_ is great, but the implentation is a little awkward to use and it's too difficult to support both server and client with one codebase. If only there was a way to have a single implementation, shared between both server and client?!

That's what this lib is intended to help with ...

## Usage

The code examples show [SvelteKit](https://kit.svelte.dev/) features to reference environment variables, but the approach should be usable wit other web frameworks too. It also has a useful naming convention where anything ending in `.server` is automatically blocked from being accidentally referenced by, and bundled into, client-side code. We've used the same convention in our module naming to benefit from it.

### Installation

Install using your package manager of choice (which should really be `pnpm`):

    pnpm i -D firestore-converter

### Provided Types

Import the types from the 'firestore-converter' package that will allow you to define you object model, DB model and converter:

```ts
import type {
  FirestoreDataConverter, WithFieldValue, DocumentData, QueryDocumentSnapshot,
  Binary, Timestamp, Converter,
} from 'firestore-converter'
```

Some of these types are just to make it convenient and easy to migrate existing data converter code you may have and avoid having to decide whether you should be importing them from the `firebase/firestore` package or `firebase-admin/firestore`:

* `FirestoreDataConverter`
* `WithFieldValue`
* `DocumentData`
* `QueryDocumentSnapshot`

The `Binary` type provides a consistent way to represent binary data in the database model instead of having to deal with `Buffer` (in the `firebase-admin` Server SDK) vs `Bytes` (in the `firebase` Client SDK).

The `Timestamp` likewise represents Firestore Timestamp data in a consistent way, to make it easy to use the conversion functions to translate to and from regular JavaScript Date objects.

Finally, the `Converter` interface provides access to several functions to transform between the various `Timestamp` and `Binary` representations and regular JavaScript Date Objects, `Uint8array` typed arrays, and Base64 or Hex encoded strings.

### Object Model and DB Model

Using these types, we can define our object models (how data is represented to our app) and a corresponding DB model (how data is stored in Firestore). These don't _have_ to match 1:1, and you can even create rich interfaces to [handle schema versioning](https://www.captaincodeman.com/schema-versioning-with-google-firestore).

For this example though, we'll keep things simple to focus on the type conversions required:

First, the in-memory object model. Note that `photo` is a binary value but we want to use it as a Base64 string:

```ts
export interface Person {
  id: string
  name: string
  dob: Date
  photo: string // base 64 string
}
```

The DB model doesn't include the `id` field (which is in the document ref) and stores the `dob` Date field as a `Timestamp` and the `photo` Base64 string as `Binary`:

```ts
export interface DBPerson {
  name: string
  dob: Timestamp
  photo: Binary
}
```

### Converter Class

Now we define our converter class. This will implement the `FirestoreDataConverter<Model, DBModel>` interface, and accept an instance of the `Converter` in the constructor. The `toFirtestore` method will convert from the in memory object model to the DB model, and the `fromFirestore` method in the opposite direction. Each can make use of the provided `Converter` instance methods to convert the appropriate fields.

```ts
export class PersonConverter implements FirestoreDataConverter<Person, DBPerson> {
  constructor(private readonly convert: Converter) {}

  toFirestore(modelObject: WithFieldValue<Person>): WithFieldValue<DBPerson> {
    return {
      name: modelObject.name,
      dob: this.convert.fromDate(modelObject.dob as Date),
      photo: this.convert.fromBase64String(modelObject.photo as string),
    }
  }

  fromFirestore(snapshot: QueryDocumentSnapshot<DocumentData, DocumentData>): Person {
    const person = snapshot.data() as DBPerson
    return {
      id: snapshot.id,
      name: person.name,
      dob: this.convert.toDate(person.dob),
      photo: this.convert.toBase64String(person.photo),
    }
  }
}
```

### Firebase Clients

The converter class we've defined can now be used from the Server or the Client SDK. This is done by importing the appropriate `converter` implementation in each and passing it to the `PersonConverter` constructor to create an instance.

#### firebase.server

Here is an example of creating a firestore client on the server, using the `firebase-admin` SDK, and then using the `PersonConverter`. Not the import of the converter from `firestore-converter/firebase.server`. This is designed to handle the server representation of Firestore data.

```ts
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
```

#### firebase

The firestore client on the browser, usinfg the `firebase` SDK is similar. But we now import the converter from `firestore-converter/firebase` instead. This know how to handle the client representation of Firestore data.

```ts
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
import { converter } from 'firestore-converter/firebase'

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

const personConverter = new PersonConverter(converter)

export async function getPeople() {
  const col = collection(firestore, 'people').withConverter(personConverter)
  const snap = await getDocs(col)
  const people = snap.docs.map(doc => doc.data())
  return people
}
```

### Result

We can now load an save data easily from both client and server, using a single definition of the data converter class.