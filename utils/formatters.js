import numbro from 'numbro'

/**
 * Run test to check if string has an uppercase letter
 *
 * @param {string} string string that will be tested
 *
 * @returns {boolean} whether string contains one lowercase AND one uppercase
 */
export const testForCase = string => /(?=.*?[a-z])(?=.*?[A-Z])/.test(string)

/**
 * Run test to check if string has at least one number
 *
 * @param {string} string string that will be tested
 *
 * @returns {boolean} whether string contains a number
 */
export const testForNumber = string => /(?=.*?[0-9])/.test(string)

/**
 * Format number to have different expressions
 *
 * @param {number} number  number that will be formatted
 *
 * @returns {number} if the number given is greater than 1000 returns formatted number else return the original number
 */
export const numberFormatter = number =>
  number < 1000 ? number : numbro(number).format({ mantissa: 1, optionalMantissa: true, thousandSeparated: true })

/**
 *  Counts the amount of lines for a given element with a text body
 *
 * @param {string} element Text element identified by id
 *
 * @returns {number}
 */

export const countLines = ele => {
  const text = document.getElementById(ele)
  if (text) {
    const totalHeight = text.scrollHeight
    const lineHeight = parseInt(window.getComputedStyle(text).getPropertyValue('line-height'), 10)
    return Math.round(totalHeight / lineHeight)
  }
  return 0
}

/**
 * Format mobile number while user types
 *
 * @param {string} value string that will be converted
 *
 * @returns {string} formatted mobile number (XXX) XXX-XXXX
 */
export const formatMobile = value => {
  let val = value.replace(/\D/g, '').match(/1?(\d{0,3})(\d{0,3})(\d{0,4})/)

  val = !val[2] ? val[1] : '(' + val[1] + ') ' + val[2] + (val[3] ? '-' + val[3] : '')

  return val
}

/**
 * Format birthday while user types
 *
 * @param {string} value string that will be converted
 *
 * @returns {string} formatted birthday XX/XX
 */
export const formatDateByMonthDay = value => {
  let val = value.replace(/\D/g, '').match(/(\d{0,2})(\d{0,2})/)

  if (val[1] > 12 || val[1] === '00') return val[1][0]

  if (val[2] > 31 || val[2] === '00') return `${val[1]}/${val[2][0]}`

  return !val[2] ? val[1] : `${val[1]}/${val[2]}`
}

/**
 * Format state while user types
 *
 * @param {string} value string that will be converted
 *
 * @returns {string} formatted state XX
 */
export const formatState = value => {
  return value.match(/^[A-Za-z]+$/) ? value.toUpperCase() : value.slice(0, value.length - 1)
}

/**
 * Format zip while user types
 *
 * @param {string} value string that will be converted
 *
 * @returns {string} formatted zip XXXXX
 */
export const formatZip = value => {
  return value.match(/^[0-9]+$/) ? value.toUpperCase() : value.slice(0, value.length - 1)
}

/**
 * Convert variables to sentence
 *
 * @param {string} value var name that will be converted
 *
 * @returns {string} formatted into a phrase with spaces
 */
export const formatVarToPhrase = value => {
  const result = value.replace(/([A-Z])/g, ' $1')

  return result.charAt(0).toUpperCase() + result.slice(1)
}
