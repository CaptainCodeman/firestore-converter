import type { Bytes } from 'firebase/firestore'
import type { Timestamp as ClientTimestamp } from 'firebase/firestore'
import type { Timestamp as AdminTimestamp } from 'firebase-admin/firestore'

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
  get id(): string;
  data(): TDB
}

/**
 * Type alias for representing binary data in Firestore. Can be Bytes from
 * the Firebase SDK or Uint8Array when running in Node.js
 */
export type Binary = Bytes | Uint8Array

/**
 * Type alias for a Firestore Timestamp value. Can represent either
 * a Timestamp from the client SDK or admin SDK. Allows writing
 * code that works with both.
 */
export type Timestamp = ClientTimestamp | AdminTimestamp

/**
 * Exports the Converter interface which defines methods for converting
 * between Firestore data types like Binary and Timestamp and other formats.
 *
 * This allows writing code that is agnostic to whether it is running
 * in a Node.js or browser context.
 */
export interface Converter {
  fromBase64String(value: string): Binary
  toBase64String(value: Binary): string
  fromUint8Array(value: Uint8Array): Binary
  toUInt8Array(value: Binary): Uint8Array
  fromHexString(value: string): Binary
  toHexString(value: Binary): string
  fromString(value: string): Binary
  toString(value: Binary): string
  fromDate(value: Date): Timestamp
  toDate(value: Timestamp): Date
  isBinary(value: any): boolean
  isTimestamp(value: any): boolean
  arrayRemove(...elements: any[]): FieldValue
  arrayUnion(...elements: any[]): FieldValue
  delete(): FieldValue
  increment(n: number): FieldValue
  serverTimestamp(): FieldValue
}

/** Type alias for primitive JavaScript types that can be stored in Firestore. */
type Primitive = string | number | boolean | undefined | null

/** Type alias for Firestore sentinel values */
type FieldValue = any

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
export interface FirestoreDataConverterConstructor<T, TDB extends DocumentData> {
  new(convert: Converter): FirestoreDataConverter<T, TDB>
}

/**
 * Interface for a FirestoreDataConverter.
 */
export interface FirestoreDataConverter<T, TDB extends DocumentData> {
  toFirestore(modelObject: WithFieldValue<T>): WithFieldValue<TDB>
  fromFirestore(snapshot: QueryDocumentSnapshot<DocumentData, DocumentData>): T
}

/**
 * Recursively converts Firestore data types in the given object to native
 * JavaScript types using the provided Converter.
 */
export function convertValue(convert: Converter, obj: DocumentData) {
  for (const prop in obj) {
    const value = obj[prop]
    if (convert.isBinary(value)) {
      obj[prop] = convert.toUInt8Array(value)
    } else if (convert.isTimestamp(value)) {
      obj[prop] = convert.toDate(value)
    } else if (Array.isArray(value)) {
      value.forEach(v => convertValue(convert, v))
    } else if (typeof value === 'object') {
      convertValue(convert, value)
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
export abstract class DefaultConverterBase {
  private readonly handle_id: boolean
  private readonly transform: (id: string) => string

  constructor(private readonly converter: Converter, options?: DefaultConverterOptions) {
    this.handle_id = options && options.handle_id || true
    this.transform = options && options.transform || (id => id)
  }

  protected toFirestoreDefault<T extends DocumentData>(model: T) {
    if (this.handle_id) {
      const { id, ...data } = model
      return data
    } else {
      return model
    }
  }

  protected fromFirestoreDefault<T extends DocumentData>(snapshot: QueryDocumentSnapshot<T, DocumentData>) {
    const data = convertValue(this.converter, snapshot.data())

    return (this.handle_id
      ? { ...data, id: this.transform(snapshot.id) }
      : data
    ) as T
  }
}