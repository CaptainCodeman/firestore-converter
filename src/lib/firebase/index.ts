import { Bytes, Timestamp } from 'firebase/firestore'
import { uint8ArrayToHex, hexToUint8Array } from 'uint8array-extras'
import { uint8ArrayToString, stringToUint8Array } from 'uint8array-extras'
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
  fromDate: function (value: Date): Timestamp {
    return Timestamp.fromDate(value)
  },
  toDate: function (value: Timestamp): Date {
    return value.toDate()
  }
}
