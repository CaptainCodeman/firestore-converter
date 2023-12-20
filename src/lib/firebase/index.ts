import { Bytes, Timestamp } from 'firebase/firestore'
import { uint8ArrayToHex, hexToUint8Array } from 'uint8array-extras'
import { uint8ArrayToString, stringToUint8Array } from 'uint8array-extras'
import type { FirestoreDataConverter, DocumentData, WithFieldValue, QueryDocumentSnapshot } from 'firebase/firestore'
import { convertValue } from "../converter"
import type { Converter } from "../converter"

export const converter: Converter = {
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
  }
}

export class DefaultConverter<T extends { id: string }> implements FirestoreDataConverter<T, DocumentData>{
  toFirestore(model: WithFieldValue<T>): WithFieldValue<DocumentData> {
    return model as WithFieldValue<DocumentData>
  }

  fromFirestore(snapshot: QueryDocumentSnapshot<T, DocumentData>): T {
    const id = snapshot.id
    const data = convertValue(converter, snapshot.data())

    return { ...data, id } as T
  }
}