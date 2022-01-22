// https://www.npmjs.com/package/@buttercup/react-formatted-input

// Credit:
// @Blake Knight
// @Josh Kincheloe
import { format } from '@buttercup/react-formatted-input'

/**
 * Validation function that returns an error message if the value is doesn't
 * seem to be a valid ZIP code.
 * @see matchUSZIPCode
 * @return {string} an error message or `undefined` if no error
 */
export const matchUSZIPCode = /^\d{5}(?:[- ]?\d{4})?$/

/**
 * @typedef {Object} FormattingResults
 * @prop {string} formatted - the formatted representation of the string
 * @prop {string} raw - the string stripped of extra characters
 */

// Phone number in the format (999) 999-9999
const USPhoneNumberFormat = [
  { exactly: '(' },
  { char: /\d/, repeat: 3 },
  { exactly: ')' },
  { exactly: ' ' },
  { char: /\d/, repeat: 3 },
  { exactly: '-' },
  { char: /\d/, repeat: 4 },
]

/**
 * Run multiple validation functions returning the first, if any, error message.
 * @param {...function} fns - validation functions to run
 * @return {string|undefined} an error message or `undefined` if no errors
 */
export const combineValidations = (...fns) => value => fns.reduce((error, fn) => error || fn(value), undefined)

/**
 * Formats a string as a U.S. phone number
 * @param {string} value - the value to format
 * @return {FormattingResults}
 */
export const formatUSPhoneNumber = value => format(value, USPhoneNumberFormat)

/**
 * Tests if a string is likely a valid email address. Note the email format is
 * very lenient, but it also accepts higher-unicode emails where most regex
 * solutions return a false negative.
 * @param {string} value - the value to test
 * @return {boolean} if the value matches formatting for an email address
 */
export const isValidEmail = value => /.+@.+\..+/i.test(value)

/**
 * Tests if a string represents a U.S. phone number
 * @param {string} value - the value to test
 * @return {boolean} if the value matches formatting for a U.S. phone number
 */
export const isValidUSPhoneNumber = value => formatUSPhoneNumber(value).raw.length === 10

/**
 * Tests if a string is in the proper format for a U.S. ZIP code
 * @param {string} value - the value to test
 * @return {boolean} if the value matches formatting for a U.S. ZIP code
 */
export const isValidZipCode = value => /^\d{5}(?:[- ]?\d{4})?$/.test(value)

/**
 * Validation function that returns an error message if the value doesn't seem
 * to be a valid email.
 * @see isValidEmail
 * @param {string} [value] - the field value to test
 * @return {string} an error message or `undefined` if no error
 */
export const validateEmail = value => (isValidEmail(value) ? undefined : 'Invalid email address')

/**
 * Validation function that returns an error message if the value doesn't seem
 * to be a valid phone number.
 * @see isValidUSPhoneNumber
 * @param {string} value - the field value to test
 * @return {string} an error message or `undefined` if no error
 */
export const validatePhone = value => (isValidUSPhoneNumber(value) ? undefined : 'Invalid phone number')

/**
 * Validation function that returns an error message if the value is falsy. Note
 * that a truthy test is good enough because field values should be strings and
 * never, for example, 0.
 * @param {string} value - the field value to test
 * @return {string} an error message or `undefined` if no error
 */
export const validateRequired = value => (value ? undefined : 'Required')

/**
 * Validation function that returns an error message if the value is doesn't
 * seem to be a valid ZIP code.
 * @see isValidZipCode
 * @param {string} value - the field value to test
 * @return {string} an error message or `undefined` if no error
 */
export const validateZipCode = value => (isValidZipCode(value) || value === '' ? undefined : 'Invalid ZIP code')
