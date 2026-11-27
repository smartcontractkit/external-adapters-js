import { randomUUID } from 'crypto'
import CryptoJS from 'crypto-js'
import { BaseEndpointTypes } from '../endpoint/reserve'

export interface SignatureParams {
  method: string
  path: string
  timestamp: number
  nonce: string
  userId: string
  agreementNumber: string
  hmacSecret: string
}

// The provider signs the method, the timestamp, the nonce, the path, the user ID
// and the agreement number, one per line, with HMAC-SHA256 and base64 output.
export const signRequest = (params: SignatureParams): Record<string, string> => {
  const { method, path, timestamp, nonce, userId, agreementNumber, hmacSecret } = params
  const message = [method, timestamp, nonce, path, userId, agreementNumber].join('\n')
  const signature = CryptoJS.HmacSHA256(message, hmacSecret).toString(CryptoJS.enc.Base64)

  return {
    'Amina-Nonce': nonce,
    'Amina-Timestamp': timestamp.toString(),
    'Amina-Uri': path,
    'Amina-Signature': signature,
    'Amina-Context-Agreement-Number': agreementNumber,
  }
}

// Every positions request carries a fresh nonce, the request time, the bearer
// token and the request/correlation IDs. The signed text has no host and no
// query string: it is the path alone.
export const buildPositionHeaders = ({
  path,
  accessToken,
  settings,
}: {
  path: string
  accessToken: string
  settings: BaseEndpointTypes['Settings']
}): Record<string, string> => {
  const signatureHeaders = signRequest({
    method: 'GET',
    path,
    timestamp: Math.floor(Date.now() / 1000),
    nonce: randomUUID(),
    userId: settings.AMINA_USER_ID,
    agreementNumber: settings.AMINA_AGREEMENT_NUMBER,
    hmacSecret: settings.AMINA_HMAC_SECRET,
  })

  return {
    Authorization: `Bearer ${accessToken}`,
    'X-Request-Id': randomUUID(),
    'X-Correlation-Id': randomUUID(),
    ...signatureHeaders,
  }
}
