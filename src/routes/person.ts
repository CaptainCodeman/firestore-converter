import type {
	FirestoreDataConverter,
	WithFieldValue,
	DocumentData,
	QueryDocumentSnapshot,
	Binary,
	Timestamp,
	Adapter
} from 'firestore-converter';

/** Person interface represents a person object to the application */
export interface Person {
	id: string;
	name: string;
	dob: Date;
	photo: string;
}

/** DBPerson interface represents a person object as stored in Firestore */
export interface DBPerson {
	name: string;
	dob: Timestamp;
	photo: Binary;
}

/**
 * PersonConverter implements the FirestoreDataConverter interface to convert between the Person model and DBPerson database representation.
 */
export class PersonConverter implements FirestoreDataConverter<Person, DBPerson> {
	constructor(private readonly adapter: Adapter) {}

	toFirestore(modelObject: WithFieldValue<Person>): WithFieldValue<DBPerson> {
		return {
			name: modelObject.name,
			dob: this.adapter.fromDate(modelObject.dob as Date),
			photo: this.adapter.fromBase64String(modelObject.photo as string)
		};
	}

	fromFirestore(snapshot: QueryDocumentSnapshot<DocumentData, DocumentData>): Person {
		const person = snapshot.data() as DBPerson;
		return {
			id: snapshot.id,
			name: person.name,
			dob: this.adapter.toDate(person.dob),
			photo: this.adapter.toBase64String(person.photo)
		};
	}
}
