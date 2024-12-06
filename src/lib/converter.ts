import type { Adapter, FieldValue } from './adapter'

/**
 * The DocumentData interface defines the structure of a Firestore document.
 * It contains string keys mapping to values of any type.
 */
export interface DocumentData {
	[field: string]: any
}

/**
 * Interface for a Firestore document snapshot, containing the document
 * ID and data. Allows specifying generic types for the data shape T
 * and internal database format TDB.
 */
export interface QueryDocumentSnapshot<T, TDB> {
	get id(): string
	data(): TDB
}

/** Type alias for primitive JavaScript types that can be stored in Firestore. */
type Primitive = string | number | boolean | undefined | null

/**
 * Type alias for wrapping a type T in the Firestore `FieldValue` type.
 * This allows specifying a type to be converted to a Firestore field
 * value like Timestamp or Bytes.
 */
export type WithFieldValue<T> =
	| T
	| (T extends Primitive
			? T
			: T extends {}
				? { [K in keyof T]: WithFieldValue<T[K]> | FieldValue }
				: never)

/**
 * Interface for a constructor function that creates a FirestoreDataConverter.
 */
export interface FirestoreDataConverterConstructor<T, TDB extends DocumentData = DocumentData> {
	new (adapter: Adapter): FirestoreDataConverter<T, TDB>
}

/**
 * Interface for a FirestoreDataConverter.
 */
export interface FirestoreDataConverter<T, TDB extends DocumentData = DocumentData> {
	toFirestore(modelObject: WithFieldValue<T>): WithFieldValue<TDB>
	fromFirestore(snapshot: QueryDocumentSnapshot<DocumentData, DocumentData>): T
}

/**
 * Recursively converts Firestore data types in the given object to native
 * JavaScript types using the provided Adapter.
 */
export function convertValue(adapter: Adapter, obj: DocumentData) {
	for (const prop in obj) {
		const value = obj[prop]
		if (adapter.isBinary(value)) {
			obj[prop] = adapter.toUInt8Array(value)
		} else if (adapter.isTimestamp(value)) {
			obj[prop] = adapter.toDate(value)
		} else if (Array.isArray(value)) {
			value.forEach((v) => convertValue(adapter, v))
		} else if (typeof value === 'object') {
			convertValue(adapter, value)
		}
	}

	return obj
}

/**
 * Options for configuring behavior of a DefaultConverter.
 */
export interface DefaultConverterOptions {
	handle_id?: boolean
	transform?: (id: string) => string
}

/**
 * Defines an abstract base class for converters that handle
 * default behavior like transforming IDs.
 */
export abstract class DefaultConverterBase<T extends DocumentData>
	implements FirestoreDataConverter<T, DocumentData>
{
	private readonly handle_id: boolean
	private readonly transform: (id: string) => string

	constructor(
		private readonly adapter: Adapter,
		options?: DefaultConverterOptions
	) {
		this.handle_id = (options && options.handle_id) || true
		this.transform = (options && options.transform) || ((id) => id)
	}

	toFirestore(model: WithFieldValue<T>): WithFieldValue<DocumentData> {
		if (this.handle_id) {
			const { id, ...data } = model
			return data
		} else {
			return model
		}
	}

	fromFirestore(snapshot: QueryDocumentSnapshot<T, DocumentData>) {
		const data = convertValue(this.adapter, snapshot.data())

		return (this.handle_id ? { ...data, id: this.transform(snapshot.id) } : data) as T
	}
}
