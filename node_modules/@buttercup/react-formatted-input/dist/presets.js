"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.CreditCardDate = exports.CreditCardCVV = exports.CreditCard = void 0;
const CreditCard = [{
  char: /\d/,
  repeat: 4
}, {
  exactly: "-"
}, {
  char: /\d/,
  repeat: 4
}, {
  exactly: "-"
}, {
  char: /\d/,
  repeat: 4
}, {
  exactly: "-"
}, {
  char: /\d/,
  repeat: 4
}];
exports.CreditCard = CreditCard;
const CreditCardCVV = [{
  char: /\d/,
  repeat: 4
}];
exports.CreditCardCVV = CreditCardCVV;
const CreditCardDate = [{
  char: /[01]/
}, {
  char: /[0-9]/
}, {
  exactly: "/"
}, {
  char: /2/
}, {
  char: /[0-9]/,
  repeat: 3
}];
exports.CreditCardDate = CreditCardDate;