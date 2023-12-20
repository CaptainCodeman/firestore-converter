# firestore-converter

Google Firestore has a cool and useful ['data converter' system](https://firebase.google.com/docs/reference/js/firestore_.firestoredataconverter?hl=en) that provides a way to define transforms to be used to translate entities between the version persisted to the Firestore database and your in-memory object model of it.

Unfortunately, it also has both a client-side `firebase` SDK and a server-side `firebase-admin` SDK, which of course have incompatible `FirestoreDataConverter` interfaces for defining these transforms. This makes defining them awkward.

Instead of using the `Uint8Array` for binary data on both the server and client, the SDKs use `Buffer` on the server and a custom `Bytes` object on the client. Both require separate handling.

Dates fare a little better, in that they both use a `Timestamp` field, but you need to translate between regular JavaScript Date objects (couldn't they have been used, and an extra property added to enable round-tripping with the increased precision?)

Anyway, the point is that the Firestore Data Converter _idea_ is great, but the implentation is a little awkward to use and it's too difficult to support both server and client with one codebase. If only there was a way to have a single implementation, shared between both server and client?!

That's what this lib is intended to help with ...

## Usage

The code examples show [SvelteKit](https://kit.svelte.dev/) features to reference environment variables, but the approach should be usable with other web frameworks too. It also has a useful naming convention where anything ending in `.server` is automatically blocked from being accidentally referenced by, and bundled into, client-side code. We've used the same convention in our module naming to benefit from it.

### Installation

Install using your package manager of choice (which should really be `pnpm`):

    pnpm i -D firestore-converter

### Provided Types

Import the types from the 'firestore-converter' package that will allow you to define you object model, DB model and converter:

```ts
import type {
  FirestoreDataConverter, WithFieldValue, DocumentData, QueryDocumentSnapshot,
  Binary, Timestamp, Converter
} from 'firestore-converter'
```

Some of these types are just to make it convenient and easy to migrate existing data converter code you may have and avoid having to decide whether you should be importing them from the `firebase/firestore` package or `firebase-admin/firestore`:

- `FirestoreDataConverter`
- `WithFieldValue`
- `DocumentData`
- `QueryDocumentSnapshot`

The `Binary` type provides a consistent way to represent binary data in the database model instead of having to deal with `Buffer` (in the `firebase-admin` Server SDK) vs `Bytes` (in the `firebase` Client SDK).

The `Timestamp` likewise represents Firestore Timestamp data in a consistent way, to make it easy to use the conversion functions to translate to and from regular JavaScript Date objects.

Finally, the `Converter` interface provides access to several functions to transform between the various `Timestamp` and `Binary` representations and regular JavaScript Date Objects, `Uint8array` typed arrays, and Base64 or Hex encoded strings.

### Object Model and DB Model

Using these types, we can define our object models (how data is represented to our app) and a corresponding DB model (how data is stored in Firestore). These don't _have_ to match 1:1, and you can even utilize union types and migration function to [handle schema versioning](https://www.captaincodeman.com/schema-versioning-with-google-firestore).

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

### Data Converter Class

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

You don't _have_ to declare the DB Model though, you can just use the `DocumentData` type in it's place so you only need to define the in memory object model.

Likewise you may not want to use the `WithFieldValue<Model>` in the `toFirestore` method which is only required if you'll be making use of [`FieldValue`](https://firebase.google.com/docs/reference/js/v8/firebase.firestore.FieldValue) sentinel types, but require you to cast the model types as in the example above.

### Converter Methods

The `Converter` instance passed in to your Data Converter class provides the following methods all from the perspective of the Object Model. You'll typically be using the `from...` methods in the `toFirestore` method (**from** Object Model, to DB Model) and the `to...` methods in the `fromFirestore` method (**to** Object Model, from DB Model). Personally, I would have make the 'to' and 'from' being to and from the database formats, but the firebase SDKs already used this opposite naming so I've aligned with that to hopefully avoid confusion.

| Method                                        | Description                                          |
| --------------------------------------------- | ---------------------------------------------------- |
| **fromBase64String**(value: string): Binary   | Store a Base64 encoded string as a binary field      |
| **fromUint8Array**(value: Uint8Array): Binary | Store a typed `Uint8Array` as a binary field         |
| **fromHexString**(value: string): Binary      | Store a hex encoded string as a binary field         |
| **fromString**(value: string): Binary         | Store a unicode string as a binary field             |
| **fromDate**(value: Date): Timestamp          | Store a JavaScript Date object as a Timestamp        |
| **toBase64String**(value: Binary): string     | Convert a binary field to a Base64 encoded string    |
| **toUInt8Array**(value: Binary): Uint8Array   | Convert a binary field to a typed `Uint8Array`       |
| **toHexString**(value: Binary): string        | Convert a binary field to a hex encoded string       |
| **toString**(value: Binary): string           | Convert from a binary field to a unicode string      |
| **toDate**(value: Timestamp): Date            | Convert from a Timestamp to a JavaScript Date object |

### Firebase Clients

The converter class we've defined can now be used from both the Server _and_ the Client SDK. This is done by importing the appropriate `converter` implementation in each and passing it to the `PersonConverter` constructor to create an instance. This will handle the different field type conversions required.

#### firebase.server

Here is an example of creating a Firestore client on the server, using the `firebase-admin` SDK, and then using the `PersonConverter`. Note the import of the converter from `firestore-converter/firebase.server`. This is designed to handle the server representation of Firestore data.

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

The firestore client on the browser, using the `firebase` SDK is similar. But we now import the converter from `firestore-converter/firebase` instead. This knows how to handle the client representation of Firestore data.

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

We can now load and save data easily from both client and server, using a single definition of you data converter classes.

### Default Converters

We've provided a `DefaultConverter` for both Client and Admin that will automatically convert any `Uint8Array` types in your model to and from Firestore `Binary` types, and JavaScript `Date` objects to and from Firestore `Timestamp` fields. It will iterate _all_ nested objects and arrays (including objects inside arrays) so is convenient but _might_ be less performant than a manually implemented converter if you have a very large object model with only a few properties that need converting.

`DefaultConverter` accepts an optional object paramater with the following options:

**handle_id**: boolean (default `true`) - whether to remove and restore an objects `id` property (which should be a string) when saving and loading the object. This makes it convenient to have objects with their Firestore ID as a property, without duplicating the ID in the stored data itself. If you _don't_ include the id in the object or want it persisted for some reason, set this to `false`.

**transform**: (id: string) => string (default `id => id`) - a transform to apply to the id when restoring it (after reading from Firestore). If you need to encode the id when saving to Firestore, for example using `encodeURIComponent` to allow a page `slug` to be used as a document ID (which would require special characters such as `/` be encoded to `%2F` for compatibility with Firestore) then you would set the transform to be `decodeURIComponent`. The id encoding is handled outside of the DataConverter due to the design of the Firebase SDKs.

Examples of using the `DefaultConverter` options:

```ts
interface Order {
  name: string
  email: string
  ordered: Date
  address: Address
  lines: OrderLines[]
}

interface Page {
  id: string
  markdown: string
  html: string
  tags: string[]
  created: Date
  published: Date | null
  thumbnail: Uint8Array
}

const orderConverter = new DefaultConverter<Order>({ handle_id: false })
const pageConverter = new DefaultConverter<Page>({ transform: decodeURIComponent })
```

Because it is imported from the appropriate `firestore-converter/firebase` or `firestore-converter/firebase.server` module, there is no need to pass in the corresponding converter implementation that would also be imported from the same modules.

#### firebase.server

Within your _server_ code, you would use:

```ts
import { DefaultConverter } from 'firestore-converter/firebase.server'
import { type Person } from './person'

const personConverter = new DefaultConverter<Person>()
```

#### firebase

Within the _client_ code, you would use:

```ts
import { DefaultConverter } from 'firestore-converter/firebase'
import { type Person } from './person'

const personConverter = new DefaultConverter<Person>()
```