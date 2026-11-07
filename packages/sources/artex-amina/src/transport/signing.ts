import { createHmac, randomUUID } from 'node:crypto'

export interface HmacInput {
  method: string
  timestamp: string
  nonce: string
  uri: string
  userId: string
  agreementNumber: string
  bodyHash?: string
}

export function buildHmacPayload(input: HmacInput): string {
  const fields = [
    input.method.toUpperCase(),
    input.timestamp,
    input.nonce,
    input.uri,
    input.userId,
    input.agreementNumber,
  ]
  if (input.bodyHash) {
    fields.push(input.bodyHash)
  }
  return fields.join('\n')
}

export function signHmac(payload: string, hmacSecret: string): string {
  return createHmac('sha256', hmacSecret).update(payload, 'utf8').digest('base64')
}

export interface SignedGetHeadersInput {
  uri: string
  token: string
  userId: string
  hmacSecret: string
  agreementNumber: string
  userAgent: string
  now?: number
  nonce?: string
}

export function buildSignedGetHeaders(input: SignedGetHeadersInput): Record<string, string> {
  const timestamp = Math.floor((input.now ?? Date.now()) / 1000).toString()
  const nonce = input.nonce ?? randomUUID()
  const signature = signHmac(
    buildHmacPayload({
      method: 'GET',
      timestamp,
      nonce,
      uri: input.uri,
      userId: input.userId,
      agreementNumber: input.agreementNumber,
    }),
    input.hmacSecret,
  )

  return {
    Authorization: `Bearer ${input.token}`,
    'X-Request-Id': randomUUID(),
    'X-Correlation-Id': randomUUID(),
    'User-Agent': input.userAgent,
    'Amina-Context-Agreement-Number': input.agreementNumber,
    'Amina-Nonce': nonce,
    'Amina-Timestamp': timestamp,
    'Amina-Uri': input.uri,
    'Amina-Signature': signature,
  }
}
