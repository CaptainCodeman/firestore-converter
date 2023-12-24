import type { FirestoreDataConverter, WithFieldValue, DocumentData, QueryDocumentSnapshot, Binary, Timestamp, Converter } from 'firestore-converter'

/** Person interface represents a person object to the application */
export interface Person {
  id: string
  name: string
  dob: Date
  photo: string
}

/** DBPerson interface represents a person object as stored in Firestore */
export interface DBPerson {
  name: string
  dob: Timestamp
  photo: Binary
}

/**
 * PersonConverter implements the FirestoreDataConverter interface to convert between the Person model and DBPerson database representation.
 */
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
