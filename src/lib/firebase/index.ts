import { Bytes, Timestamp } from 'firebase/firestore'
import { uint8ArrayToHex, hexToUint8Array } from 'uint8array-extras'
import { uint8ArrayToString, stringToUint8Array } from 'uint8array-extras'
import type { FirestoreDataConverter, DocumentData, WithFieldValue, QueryDocumentSnapshot } from 'firebase/firestore'
import { arrayRemove, arrayUnion, deleteField, increment, serverTimestamp } from 'firebase/firestore'
import { DefaultConverterBase  } from "../converter"
import type { Converter, DefaultConverterOptions, FirestoreDataConverterConstructor } from "../converter"

/**
 * Defines a Converter implementation for use in the browser, using firebase clientside SDK
 */
const converter: Converter = {
  fromBase64String(value: string) {
    return Bytes.fromBase64String(value)
  },
  toBase64String(value: Bytes) {
    return value.toBase64()
  },
  fromUint8Array(value: Uint8Array) {
    return Bytes.fromUint8Array(value)
  },
  toUInt8Array(value: Bytes) {
    return value.toUint8Array()
  },
  fromHexString(value: string) {
    return hexToUint8Array(value)
  },
  toHexString(value: Bytes) {
    return uint8ArrayToHex(value.toUint8Array())
  },
  fromString(value: string) {
    return stringToUint8Array(value)
  },
  toString(value: Bytes) {
    return uint8ArrayToString(value.toUint8Array())
  },
  fromDate(value: Date): Timestamp {
    return Timestamp.fromDate(value)
  },
  toDate(value: Timestamp): Date {
    return value.toDate()
  },
  isBinary(value: any): boolean {
    return value instanceof Bytes
  },
  isTimestamp(value: any): boolean {
    return value instanceof Timestamp
  },
  arrayRemove(...elements: any[]) {
    return arrayRemove(elements)
  },
  arrayUnion(...elements: any[]) {
    return arrayUnion(elements)
  },
  delete() {
    return deleteField()
  },
  increment(n: number) {
    return increment(n)
  },
  serverTimestamp() {
    return serverTimestamp()
  }
}

export function createConverter<T, TDB extends DocumentData>(dataConverter: FirestoreDataConverterConstructor<T, TDB>): FirestoreDataConverter<T, TDB> {
  return new dataConverter(converter)
}

/**
 * DefaultConverter for firebase SDK to handle common data type conversions
 */
export class DefaultConverter<T extends DocumentData> extends DefaultConverterBase implements FirestoreDataConverter<T, DocumentData> {
  constructor(options?: DefaultConverterOptions) {
    super(converter, options)
  }

  toFirestore(model: WithFieldValue<T>): WithFieldValue<DocumentData> {
    return this.toFirestoreDefault(model) as WithFieldValue<DocumentData>
  }

  fromFirestore(snapshot: QueryDocumentSnapshot<T, DocumentData>): T {
    return this.fromFirestoreDefault<T>(snapshot)
  }
}