import { Timestamp } from 'firebase-admin/firestore'
import { uint8ArrayToBase64, base64ToUint8Array } from 'uint8array-extras'
import { uint8ArrayToHex, hexToUint8Array } from 'uint8array-extras'
import { uint8ArrayToString, stringToUint8Array } from 'uint8array-extras'
import { toUint8Array } from 'uint8array-extras'
import type { Converter } from "../converter"

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
  fromDate: function (value: Date): Timestamp {
    return Timestamp.fromDate(value)
  },
  toDate: function (value: Timestamp): Date {
    return value.toDate()
  }
}
