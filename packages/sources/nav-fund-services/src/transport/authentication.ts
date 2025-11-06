import CryptoJS from 'crypto-js'
import { v4 as uuidv4 } from 'uuid'

/**
 * Generate the necessary headers for calling the NAV API with a 5-minute-valid signature.
 */
export const getRequestHeaders = ({
  method,
  path,
  body,
  apiKey,
  secret,
}: {
  method: string
  path: string
  body: string
  apiKey: string
  secret: string
}) => {
  const utcNow = new Date().toUTCString()
  const nonce = uuidv4()
  const contentHash = CryptoJS.SHA256(body).toString(CryptoJS.enc.Base64)
  const stringToSign = [apiKey, path, method, utcNow, nonce, contentHash].join(';')

  // Compute the HMAC-SHA256 signature, Base64-encoded
  const signature = CryptoJS.HmacSHA256(stringToSign, secret).toString(CryptoJS.enc.Base64)

  return {
    'x-date': utcNow,
    'x-content-sha256': contentHash,
    'x-hmac256-signature': `${apiKey};${nonce};${signature}`,
  }
}
