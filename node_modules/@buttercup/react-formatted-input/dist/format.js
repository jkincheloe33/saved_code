"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.formatValue = formatValue;

var _isRegex = _interopRequireDefault(require("is-regex"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function ownKeys(object, enumerableOnly) { var keys = Object.keys(object); if (Object.getOwnPropertySymbols) { var symbols = Object.getOwnPropertySymbols(object); if (enumerableOnly) symbols = symbols.filter(function (sym) { return Object.getOwnPropertyDescriptor(object, sym).enumerable; }); keys.push.apply(keys, symbols); } return keys; }

function _objectSpread(target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i] != null ? arguments[i] : {}; if (i % 2) { ownKeys(Object(source), true).forEach(function (key) { _defineProperty(target, key, source[key]); }); } else if (Object.getOwnPropertyDescriptors) { Object.defineProperties(target, Object.getOwnPropertyDescriptors(source)); } else { ownKeys(Object(source)).forEach(function (key) { Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key)); }); } } return target; }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

/**
 * Expand an array of patterns by duplicating those with `repeat` properties
 * @param {Array.<Object>} format An array of patterns
 * @returns {Array.<Object>} An expanded array of patterns (1 per character in value)
 */
function expandFormatRepetitions(format) {
  return format.reduce(function __reducePatterns(patterns, nextItem) {
    if (nextItem.repeat > 1) {
      const expanded = [];

      const copy = _objectSpread({}, nextItem);

      delete copy.repeat;

      for (let i = 0; i < nextItem.repeat; i += 1) {
        expanded.push(_objectSpread({}, copy));
      }

      return [...patterns, ...expanded];
    }

    return [...patterns, nextItem];
  }, []);
}
/**
 * Formatted and raw values post processing
 * @typedef {Object} FormattingResults
 * @property {String} formatted - The formatted value (includes delimiters)
 * @property {String} raw - The raw value (excludes delimiters)
 */

/**
 * Format a value for a pattern
 * @param {String} value The value to format
 * @param {Array.<Object>=} formatSpec The formatting specification to apply to the value
 * @returns {FormattingResults} The formatted and raw values
 */


function formatValue(value, formatSpec = []) {
  const format = expandFormatRepetitions(formatSpec);

  if (format.length > 0) {
    const characters = value.split("");
    let formattedValue = "",
        rawValue = "";

    while (format.length > 0 && characters.length > 0) {
      const pattern = format.shift();

      if (pattern.char) {
        let charRexp;

        if (typeof pattern.char === "object" && typeof pattern.char.test === "function") {
          charRexp = pattern.char;
        } else if (Array.isArray(pattern.char) && pattern.char.length >= 1) {
          const [rexp, mod = ""] = pattern.char;
          charRexp = new RegExp(rexp, mod);
        } else if (typeof pattern.char === "string") {
          charRexp = new RegExp(pattern.char);
        } else {
          throw new Error(`Invalid pattern provided: ${pattern.char}`);
        }

        while (characters.length > 0 && charRexp.test(characters[0]) !== true) {
          characters.shift();
        }

        if (characters.length > 0) {
          formattedValue += characters[0];
          rawValue += characters[0];
          characters.shift();
        }
      } else if (typeof pattern.exactly === "string") {
        if (pattern.exactly.length !== 1) {
          throw new Error(`Unable to format value: 'exactly' value should be of length 1: ${pattern.exactly}`);
        }

        formattedValue += pattern.exactly;

        if (pattern.exactly === characters[0]) {
          characters.shift();
        }
      } else {
        throw new Error(`Unable to format value: Invalid format specification: ${JSON.stringify(pattern)}`);
      }
    }

    return {
      formatted: formattedValue,
      raw: rawValue
    };
  }

  return {
    formatted: value,
    raw: value
  };
}