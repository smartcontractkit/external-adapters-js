import { randomInt } from 'crypto'
import CryptoJS from 'crypto-js'

export const getValidatorIds = (
  method: string,
  path: string,
  body: string,
  apiKey: string,
  secret: string,
) => {
  const nonce = createGuid()
  const utcNow = new Date().toUTCString()
  const contentHash = CryptoJS.SHA256(body).toString(CryptoJS.enc.Base64)

  const stringToSign =
    apiKey + ';' + path + ';' + method + ';' + utcNow + ';' + nonce + ';' + contentHash

  const signature = CryptoJS.HmacSHA256(stringToSign, secret).toString(CryptoJS.enc.Base64)

  return {
    'x-date': utcNow,
    'x-content-sha256': contentHash,
    'x-hmac256-signature': apiKey + ';' + nonce + ';' + signature,
  }
}

// Copied from Nav Consulting's API guide - uses crypto for secure nonce generation
const createGuid = () => {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
    const r = c === 'x' ? randomInt(0, 16) : randomInt(0, 4) | 0x8
    return r.toString(16)
  })
}
