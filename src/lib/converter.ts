import type { Bytes } from 'firebase/firestore'
import type { Timestamp as ClientTimestamp } from 'firebase/firestore'
import type { Timestamp as AdminTimestamp } from 'firebase-admin/firestore'
import type { FirestoreDataConverter, WithFieldValue } from 'firebase/firestore'

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
  isBinary(value: any): boolean
  isTimestamp(value: any): boolean
}

export class DefaultConverter<T extends { id: string }> implements FirestoreDataConverter<T, DocumentData>{
  constructor(private readonly convert: Converter) { }

  toFirestore(model: WithFieldValue<T>): WithFieldValue<DocumentData> {
    // any Uint8Array and Date fields will be handled by Firestore automatically
    return model as WithFieldValue<DocumentData>
  }

  fromFirestore(snapshot: QueryDocumentSnapshot<DocumentData, DocumentData>): T {
    const convert = this.convert
    const id = snapshot.id
    const data = snapshot.data() as DocumentData

    function convertValue(obj: any) {
      for (const prop in obj) {
        const value = obj[prop]
        if (convert.isBinary(value)) {
          obj[prop] = convert.toUInt8Array(value)
        } else if (convert.isTimestamp(value)) {
          obj[prop] = convert.toDate(value)
        } else if (Array.isArray(value)) {
          value.forEach(convertValue)
        } else if (typeof value === 'object') {
          convertValue(value)
        }
      }

      return obj
    }

    return { ...convertValue(data), id } as T
  }
}