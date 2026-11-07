import type { Requester } from '@chainlink/external-adapter-framework/util/requester'
import { AdapterError } from '@chainlink/external-adapter-framework/validation/error'
import type { AuthManager } from './auth'
import { buildSignedGetHeaders } from './signing'
import {
  DEFAULT_RETRY,
  mapAminaError,
  positionsPath,
  providerStatus,
  trimEndpoint,
  USER_AGENT,
  withRetry,
} from './utils'

const PAGE_SIZE = 20
const MAX_PAGES = 100

export interface AminaPosition {
  isin: string
  quantity: number
}

export interface AminaPositionsPage {
  positions: AminaPosition[]
  last: boolean
}

export interface PositionsSettings {
  apiEndpoint: string
  userId: string
  hmacSecret: string
  agreementNumber: string
}

export interface PositionsResult {
  positions: AminaPosition[]
  firstPageRequestedUnixMs: number
  lastPageReceivedUnixMs: number
}

interface PageResult {
  page: AminaPositionsPage
  requestedUnixMs: number
  receivedUnixMs: number
}

export interface FetchPositionsArgs {
  requester: Requester
  auth: AuthManager
  settings: PositionsSettings
  portfolioNo: number
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function invalid(message: string): AdapterError {
  return new AdapterError({ statusCode: 502, message })
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
  if (typeof data.last !== 'boolean') {
    throw invalid('AMINA positions response has an invalid last')
  }
  return {
    positions: data.positions.map(parsePosition),
    last: data.last,
  }
}

async function fetchPage(args: FetchPositionsArgs, pageNo: number): Promise<PageResult> {
  const { requester, auth, settings, portfolioNo } = args
  const uri = positionsPath(portfolioNo)

  const makeRequest = (token: string) =>
    requester.request<unknown>(`amina-positions:${portfolioNo}:${pageNo}`, {
      method: 'GET',
      baseURL: trimEndpoint(settings.apiEndpoint),
      url: `${uri}?page=${pageNo}&size=${PAGE_SIZE}`,
      headers: buildSignedGetHeaders({
        uri,
        token,
        userId: settings.userId,
        hmacSecret: settings.hmacSecret,
        agreementNumber: settings.agreementNumber,
        userAgent: USER_AGENT,
      }),
    })

  let token = await auth.getAccessToken()
  let result: Awaited<ReturnType<typeof makeRequest>>
  try {
    result = await withRetry(() => makeRequest(token), DEFAULT_RETRY)
  } catch (error) {
    if (providerStatus(error) === 401) {
      token = await auth.refreshAfter401()
      result = await withRetry(() => makeRequest(token), DEFAULT_RETRY)
    } else {
      throw mapAminaError(error)
    }
  }

  return {
    page: parsePositionsPage(result.response.data),
    requestedUnixMs: result.timestamps.providerDataRequestedUnixMs,
    receivedUnixMs: result.timestamps.providerDataReceivedUnixMs,
  }
}

export async function fetchAllPositions(args: FetchPositionsArgs): Promise<PositionsResult> {
  const positions: AminaPosition[] = []
  let firstPageRequestedUnixMs: number | undefined

  for (let pageNo = 0; pageNo < MAX_PAGES; pageNo++) {
    const result = await fetchPage(args, pageNo)
    const firstRequested = firstPageRequestedUnixMs ?? result.requestedUnixMs
    firstPageRequestedUnixMs = firstRequested
    positions.push(...result.page.positions)

    if (result.page.last) {
      return {
        positions,
        firstPageRequestedUnixMs: firstRequested,
        lastPageReceivedUnixMs: result.receivedUnixMs,
      }
    }
  }

  throw new AdapterError({
    statusCode: 502,
    message: `AMINA pagination exceeded ${MAX_PAGES} pages`,
  })
}

export function selectQuantity(positions: AminaPosition[], isin: string): number {
  const matches = positions.filter((position) => position.isin === isin)
  if (matches.length === 0) {
    throw new AdapterError({
      statusCode: 502,
      message: `No AMINA position found for ISIN ${isin}`,
    })
  }
  if (matches.length > 1) {
    throw new AdapterError({
      statusCode: 502,
      message: `Duplicate AMINA position found for ISIN ${isin} (${matches.length} matches)`,
    })
  }
  return matches[0].quantity
}
