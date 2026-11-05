import { AdapterError } from '@chainlink/external-adapter-framework/validation/error'

export interface AminaAuthResponse {
  accessToken: string
  refreshToken: string
}

export interface AminaPosition {
  isin: string
  quantity: number
}

export interface AminaPositionsPage {
  positions: AminaPosition[]
  totalPages: number
  last: boolean
  number: number
}

export interface AminaErrorResponse {
  title?: string
  detail?: string
  instance?: string
  status?: number
  type?: string
}

export interface JwtPayload {
  amina_user_id?: string | number
  exp?: number
  [key: string]: unknown
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function invalid(message: string): AdapterError {
  return new AdapterError({ statusCode: 502, message })
}

export function parseAuthResponse(data: unknown): AminaAuthResponse {
  if (!isRecord(data)) {
    throw invalid('AMINA auth response is not an object')
  }
  if (typeof data.accessToken !== 'string' || data.accessToken.length === 0) {
    throw invalid('AMINA auth response has no accessToken')
  }
  if (typeof data.refreshToken !== 'string' || data.refreshToken.length === 0) {
    throw invalid('AMINA auth response has no refreshToken')
  }
  return { accessToken: data.accessToken, refreshToken: data.refreshToken }
}

function parsePosition(raw: unknown, index: number): AminaPosition {
  if (!isRecord(raw)) {
    throw invalid(`AMINA position ${index} is not an object`)
  }
  if (typeof raw.isin !== 'string' || raw.isin.length === 0) {
    throw invalid(`AMINA position ${index} has no isin`)
  }
  if (typeof raw.quantity !== 'number' || !Number.isFinite(raw.quantity) || raw.quantity < 0) {
    throw invalid(`AMINA position ${index} has an invalid quantity`)
  }
  return { isin: raw.isin, quantity: raw.quantity }
}

export function parsePositionsPage(data: unknown): AminaPositionsPage {
  if (!isRecord(data)) {
    throw invalid('AMINA positions response is not an object')
  }
  if (!Array.isArray(data.positions)) {
    throw invalid('AMINA positions response has no positions array')
  }
  const positions = data.positions.map(parsePosition)
  if (
    typeof data.totalPages !== 'number' ||
    !Number.isInteger(data.totalPages) ||
    data.totalPages < 0
  ) {
    throw invalid('AMINA positions response has an invalid totalPages')
  }
  if (typeof data.last !== 'boolean') {
    throw invalid('AMINA positions response has an invalid last')
  }
  if (typeof data.number !== 'number' || !Number.isInteger(data.number) || data.number < 0) {
    throw invalid('AMINA positions response has an invalid number')
  }
  return {
    positions,
    totalPages: data.totalPages,
    last: data.last,
    number: data.number,
  }
}

export function parseJwtPayload(token: string): JwtPayload | undefined {
  const parts = token.split('.')
  if (parts.length !== 3) {
    return undefined
  }
  try {
    const decoded = Buffer.from(parts[1], 'base64url').toString('utf8')
    const payload: unknown = JSON.parse(decoded)
    return isRecord(payload) ? (payload as JwtPayload) : undefined
  } catch {
    return undefined
  }
}
