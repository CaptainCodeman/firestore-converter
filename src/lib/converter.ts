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
  isBinary(value: any): boolean
  isTimestamp(value: any): boolean
}

export function convertValue(convert: Converter, obj: any) {
  for (const prop in obj) {
    const value = obj[prop]
    if (convert.isBinary(value)) {
      obj[prop] = convert.toUInt8Array(value)
    } else if (convert.isTimestamp(value)) {
      obj[prop] = convert.toDate(value)
    } else if (Array.isArray(value)) {
      value.forEach(convertValue)
    } else if (typeof value === 'object') {
      convertValue(convert, value)
    }
  }

  return obj
}

export interface DefaultConverterOptions {
  handle_id?: boolean
  transform?: (id: string) => string
}

export abstract class DefaultConverterBase {
  private readonly handle_id: boolean
  private readonly transform: (id: string) => string

  constructor(private readonly converter: Converter, options?: DefaultConverterOptions) {
    this.handle_id = options && options.handle_id || true
    this.transform = options && options.transform || (id => id)
  }

  protected toFirestoreDefault<T extends DocumentData>( model: T) {
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