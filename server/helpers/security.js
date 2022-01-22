const bcrypt = require('bcrypt')
const PhpPassword = require('node-php-password')
const jwt = require('jsonwebtoken')
const PasswordValidator = require('password-validator')

// NOTE: To rotate jwt signing key you move the current JWT_SIGN_KEY -> JWT_SIGN_KEY_SECONDARY.
//    at the same time generate a new 32 character key to put in JWT_SIGN_KEY

const jwtSignKey = Buffer.from(process.env.JWT_SIGN_KEY).toString('base64')

// Only used for verification (don't ever issue a token signed by the secondary key)...EK
const jwtSignKeySecondary = process.env.JWT_SIGN_KEY_SECONDARY ? Buffer.from(process.env.JWT_SIGN_KEY_SECONDARY).toString('base64') : null

// NOTE!!! BEWARE (this is an exponential, 2^saltRounds.  Setting this to 31 will take days to hash one password...EK)
//    https://www.npmjs.com/package/bcrypt#a-note-on-rounds
const saltRounds = 10

const jwtVerificationOptions = {
  ignoreNotBefore: true,
  issuer: 'wambi',
  clockTolerance: '15s',
}

module.exports = {
  verifyPassword: async (plainText, passwordHash) => {
    if (passwordHash?.startsWith('$2y')) return PhpPassword.verify(plainText, passwordHash)
    return await bcrypt.compare(plainText, passwordHash)
  },
  verifyJwt: async token => {
    return new Promise((resolve, reject) => {
      jwt.verify(token, jwtSignKey, jwtVerificationOptions, (err, decoded) => {
        if (err) {
          // The primary key failed to validate the token, if there is a secondary key, see if the token was signed with it..EK
          if (jwtSignKeySecondary != null) {
            jwt.verify(token, jwtSignKeySecondary, jwtVerificationOptions, (err, decoded) => {
              if (err) reject(false)
              else resolve(decoded)
            })
          } else {
            reject(false)
          }
        } else {
          resolve(decoded)
        }
      })
    })
  },
  signJwt: (tokenData, expiresIn) => {
    return jwt.sign(tokenData, jwtSignKey, {
      expiresIn,
      issuer: 'wambi',
    })
  },
  hashPassword: async plainText => {
    return await bcrypt.hash(plainText, saltRounds)
  },
  checkPasswordStrength: password => {
    let rules = new PasswordValidator()

    rules.is().min(8).is().max(100).has().lowercase().has().uppercase().has().digits(1).has().not().spaces()

    let validationRes = rules.validate(password, { list: true })

    if (validationRes.length === 0) {
      // No rules failed.. Return that the password is valid...EK
      return { valid: true }
    } else {
      return { valid: false, checksFailed: validationRes }
    }
  },
}
