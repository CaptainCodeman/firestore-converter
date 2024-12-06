import type { Bytes } from 'firebase/firestore'
import { Timestamp as ClientTimestamp } from 'firebase/firestore'
import { Timestamp as AdminTimestamp } from 'firebase-admin/firestore'

/**
 * Type alias for representing binary data in Firestore. Can be Bytes from
 * the Firebase SDK or Uint8Array (/ )Buffer) when running in Node.js
 */
export type Binary = Bytes | Uint8Array

/**
 * Type alias for a Firestore Timestamp value. Can represent either
 * a Timestamp from the client SDK or admin SDK. Allows writing
 * code that works with both.
 */
export type Timestamp = ClientTimestamp | AdminTimestamp

/** Type alias for Firestore sentinel values */
export type FieldValue = any

/**
 * Exports the Adapter interface which defines methods for converting
 * between Firestore data types like Binary and Timestamp and other formats.
 *
 * This allows writing code that is agnostic to whether it is running
 * in a Node.js or browser context.
 */
export interface Adapter {
	/**
	 * Converts a base64 encoded string to a Binary value.
	 */
	fromBase64String(value: string): Binary

	/**
	 * Converts a Binary value to a base64 encoded string.
	 */
	toBase64String(value: Binary): string

	/**
	 * Converts a Uint8Array to a Binary value.
	 */
	fromUint8Array(value: Uint8Array): Binary

	/**
	 * Converts a Binary value to a Uint8Array.
	 */
	toUInt8Array(value: Binary): Uint8Array

	/**
	 * Converts a hexadecimal string to a Binary value.
	 */
	fromHexString(value: string): Binary

	/**
	 * Converts a Binary value to a hexadecimal string representation.
	 */
	toHexString(value: Binary): string

	/**
	 * Converts a string value to a Binary data type.
	 */
	fromString(value: string): Binary

	/**
	 * Converts a Binary value to a string representation.
	 */
	toString(value: Binary): string

	/**
	 * Converts a Date value to a Timestamp.
	 */
	fromDate(value: Date): Timestamp

	/**
	 * Converts a Timestamp value to a JavaScript Date object.
	 */
	toDate(value: Timestamp): Date

	/**
	 * Checks if the given value is a Binary data type.
	 */
	isBinary(value: any): boolean

	/**
	 * Checks if the given value is of the Firestore Timestamp type.
	 */
	isTimestamp(value: any): boolean

	/**
	 * Returns a FieldValue sentinel to remove the given elements from an array field in a Firestore document.
	 */
	arrayRemove(...elements: any[]): FieldValue

	/**
	 * Returns a FieldValue sentinel to add the given elements to an array field in a Firestore document.
	 */
	arrayUnion(...elements: any[]): FieldValue

	/**
	 * Returns a FieldValue sentinel to delete the given field from the document on the server.
	 */
	delete(): FieldValue

	/**
	 * Returns a FieldValue sentinel to increment the given field's value by the amount specified.
	 */
	increment(n: number): FieldValue

	/**
	 * Returns a FieldValue sentinel to set the field to the server's current timestamp.
	 */
	serverTimestamp(): FieldValue
}
