import { useEffect } from 'react'
import moment from 'moment'

import { colors as themeColors, multiplier } from '@assets'

export const absoluteUrl = (req, setLocalhost) => {
  var protocol = 'https:'
  var host = req ? req.headers['x-forwarded-host'] || req.headers['host'] : window.location.host
  if (host.indexOf('localhost') > -1) {
    if (setLocalhost) host = setLocalhost
    protocol = 'http:'
  }
  return {
    protocol: protocol,
    host: host,
    origin: protocol + '//' + host,
  }
}

export const getDateRanges = () => {
  const today = moment()
  const beginningOfMonth = moment().startOf('month')
  const beginningOfQuarter = moment().startOf('quarter')
  const beginningOfYear = moment().startOf('year')
  const prevMonthFirstDay = moment().subtract(1, 'month').startOf('month')
  const prevQuarterFirstDay = moment().subtract(1, 'quarter').startOf('quarter')
  const ytd = today.diff(beginningOfYear, 'days')

  return {
    options: [
      { name: 'Last 7 days', value: '7' },
      { name: 'Last 30 days', value: '30' },
      { name: 'Last 90 days', value: '90' },
      // can't use the real values here because e.target.value converts moment to a string...JK
      { name: 'Last Month', value: 'Last Month' },
      { name: 'Last Quarter', value: 'Last Quarter' },
      { name: 'Month to Date', value: 'Month to Date' },
      { name: 'Quarter to Date', value: 'Quarter to Date' },
      { name: 'Year to Date', value: ytd },
    ],
    values: {
      beginningOfMonth,
      beginningOfQuarter,
      last7Days: '7',
      last30Days: '30',
      last90Days: '90',
      prevMonthFirstDay,
      prevQuarterFirstDay,
      ytd,
    },
  }
}

/**
 * Allows you to set any kind of gradient on an element. You can pass a type,
 * position (angle), and any amount of colors with their own hex and location...JK
 *
 * @param {Array} colors    an array of objects consisting of a color and location properties
 *                            color: can be a string from the theme or any hex/rgba value
 *                            location: represents starting location (0%, 30%, 100%, etc)
 * @param {String} position represents the direction you want the gradient to go
 * @param {String} type     type of gradient (linear || radial)
 * @returns {String}        background-image with the gradient
 */
export const gradientGenerator = ({ colors, position = 'to right', type = 'linear' }) => {
  const colorMap = colors.map(color => {
    return `${themeColors[color.color] ?? color.color} ${color.location}`
  })

  return `
      background-image:
        ${type}-gradient(${position},
        ${colorMap.toString()});
    `
}

/**
 * sets the spacing based on our theme multiplier...JK
 *
 * @param {Number} number number to be multiplied by theme multiplier
 * @returns {Number}      result of multiplication
 */
export function getSpacing(number = 1) {
  return multiplier * number
}

export function handleClickOut(ref, callback) {
  const handleClick = event => {
    if (Array.isArray(ref)) {
      if (!ref.some(r => r.current && r.current.contains(event.target))) {
        callback()
      }
    } else {
      if (ref.current && !ref.current.contains(event.target)) {
        callback()
      }
    }
  }

  // eslint-disable-next-line react-hooks/rules-of-hooks
  useEffect(() => {
    document.addEventListener('mousedown', handleClick)

    return () => {
      document.removeEventListener('mousedown', handleClick)
    }
  })
}

/**
 * remove properites from object
 *
 * @param {Object} obj        any object that you want to remove properties from
 * @param {Array}  properties an array of object keys that you want deleted
 *
 * @returns {Object} new object with specified properties removed
 */

export const removeProperties = (obj, properties) => {
  const filteredObj = Object.assign({}, obj)
  properties.forEach(property => delete filteredObj[property])
  return Object.entries(filteredObj).length === 0 ? null : filteredObj
}

/**
 * Generates a unique ID. `Prefix` is given, and the ID is appended to it.
 *
 * @param {string} prefix The value to prefix the ID with.
 * @returns {string} Returns the unique ID.
 * @see random
 * @example
 *
 * uId('contact_')
 * // => 'contact_104'
 *
 * uId()
 * // => '105'
 */

const idCounter = {}

export const uId = prefix => {
  if (!idCounter[prefix]) {
    idCounter[prefix] = 0
  }

  const id = ++idCounter[prefix]

  return `${prefix}-${id}`
}

/**
 * Removes duplicates from an array
 *
 * @param {Array} array an array you want to remove duplicates from
 * @param {String} key an optional object key you want remove based on for an array of objects
 *
 * @returns {Array} new array with distinct entries
 */

export const removeDuplicates = (array, key) => {
  if (key) return [...new Map(array.map(item => [item[key], item])).values()]
  return [...new Set(array)]
}

export const capitalizeWords = str => {
  const strTokenized = str.split(' ').filter(s => s !== '')
  return strTokenized.map(e => e[0].toUpperCase() + e.substring(1, str.length)).join(' ')
}

//Inject extra params from query...CY
export const getExtraQueryParams = query =>
  Object.keys(query)
    .map(key => (key !== 'prevUrl' ? `&${key}=${query[key]}` : ''))
    .join('')

export const isFirstLetterVowel = string => {
  if (!string) return false

  const vowels = 'aeiouAEIOU'

  return vowels.indexOf(string[0]) !== -1
}
