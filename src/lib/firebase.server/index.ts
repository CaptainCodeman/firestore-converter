import { Timestamp } from 'firebase-admin/firestore'
import { uint8ArrayToBase64, base64ToUint8Array } from 'uint8array-extras'
import { uint8ArrayToHex, hexToUint8Array } from 'uint8array-extras'
import { uint8ArrayToString, stringToUint8Array } from 'uint8array-extras'
import { toUint8Array } from 'uint8array-extras'
import type { FirestoreDataConverter, DocumentData, WithFieldValue, QueryDocumentSnapshot } from 'firebase-admin/firestore'
import { DefaultConverterBase } from "../converter"
import type { Converter, DefaultConverterOptions } from "../converter"

/**
 * Defines a Converter implementation for use in node, using firebase-admin serverside SDK
 */
export const converter: Converter = {
  fromBase64String(value: string) {
    return base64ToUint8Array(value)
  },
  toBase64String(value: Uint8Array) {
    return uint8ArrayToBase64(value)
  },
  fromUint8Array(value: Uint8Array) {
    return toUint8Array(value)
  },
  toUInt8Array(value: Uint8Array) {
    return toUint8Array(value)
  },
  fromHexString(value: string) {
    return hexToUint8Array(value)
  },
  toHexString(value: Uint8Array) {
    return uint8ArrayToHex(value)
  },
  fromString(value: string) {
    return stringToUint8Array(value)
  },
  toString(value: Uint8Array) {
    return uint8ArrayToString(value)
  },
  fromDate(value: Date): Timestamp {
    return Timestamp.fromDate(value)
  },
  toDate(value: Timestamp): Date {
    return value.toDate()
  },
  isBinary(value: any): boolean {
    return value instanceof Buffer
  },
  isTimestamp(value: any): boolean {
    return value instanceof Timestamp
  }
}

/**
 * DefaultConverter for firebase-admin SDK to handle common data type conversions
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