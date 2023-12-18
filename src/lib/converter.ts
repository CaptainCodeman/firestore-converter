import type { Bytes } from 'firebase/firestore'
import type { Timestamp as ClientTimestamp } from 'firebase/firestore'
import type { Timestamp as AdminTimestamp } from 'firebase-admin/firestore'

export interface DocumentData {
  [field: string]: any;
}

export interface QueryDocumentSnapshot<T, TDB> {
  get id(): string;
  data(): TDB
}

export type Binary = Bytes | Uint8Array
export type Timestamp = ClientTimestamp | AdminTimestamp

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
}
