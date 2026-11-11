import type { Requester } from '@chainlink/external-adapter-framework/util/requester'
import {
  AdapterDataProviderError,
  AdapterError,
} from '@chainlink/external-adapter-framework/validation/error'
import type { AuthManager } from './auth'
import { mapAminaError } from './errors'
import { positionsPath, trimEndpoint } from './paths'
import { DEFAULT_RETRY, withRetry } from './retry'
import { buildSignedGetHeaders } from './signing'

const PAGE_SIZE = 2000
export const MAX_PAGES = 100
const USER_AGENT = 'chainlink-artex-amina-adapter/1.0.0'

export interface AminaPosition {
  isin: string
  quantity: number
}

export interface AminaPositionsPage {
  positions: AminaPosition[]
  totalPages: number
  number: number
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

function isPosition(value: unknown): value is AminaPosition {
  return (
    isRecord(value) &&
    typeof value.isin === 'string' &&
    value.isin.length > 0 &&
    typeof value.quantity === 'number' &&
    Number.isFinite(value.quantity) &&
    value.quantity >= 0 &&
    Number(value.quantity.toFixed(4)) === value.quantity
  )
}

export function parsePositionsPage(data: unknown): AminaPositionsPage {
  if (
    !isRecord(data) ||
    !Array.isArray(data.positions) ||
    !data.positions.every(isPosition) ||
    typeof data.totalPages !== 'number' ||
    !Number.isInteger(data.totalPages) ||
    data.totalPages < 0 ||
    typeof data.number !== 'number' ||
    !Number.isInteger(data.number) ||
    data.number < 0 ||
    typeof data.last !== 'boolean'
  ) {
    throw invalid('AMINA positions response is malformed')
  }
  return {
    positions: data.positions,
    totalPages: data.totalPages,
    number: data.number,
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
    if (error instanceof AdapterDataProviderError && error.providerStatusCode === 401) {
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

// AMINA returns `last` per page, so page N+1 depends on page N.
// HttpTransport.prepareRequests prepares requests up front and cannot chain
// them; SubscriptionTransport is the framework seam for this custom flow.
export async function fetchAllPositions(args: FetchPositionsArgs): Promise<PositionsResult> {
  const positions: AminaPosition[] = []
  let expectedTotalPages: number | undefined
  let firstPageRequestedUnixMs: number | undefined
  let lastPageReceivedUnixMs: number | undefined
  let completed = false

  for (let pageNo = 0; pageNo < MAX_PAGES; pageNo++) {
    const result = await fetchPage(args, pageNo)
    if (firstPageRequestedUnixMs === undefined) {
      firstPageRequestedUnixMs = result.requestedUnixMs
    }
    lastPageReceivedUnixMs = result.receivedUnixMs

    if (result.page.number !== pageNo) {
      throw new AdapterError({
        statusCode: 502,
        message: `AMINA returned page ${result.page.number} for requested page ${pageNo}`,
      })
    }

    if (expectedTotalPages === undefined) {
      expectedTotalPages = result.page.totalPages
      if (expectedTotalPages > MAX_PAGES) {
        throw new AdapterError({
          statusCode: 502,
          message: `AMINA totalPages ${expectedTotalPages} exceeds ${MAX_PAGES} pages`,
        })
      }
    } else if (result.page.totalPages !== expectedTotalPages) {
      throw new AdapterError({
        statusCode: 502,
        message: `AMINA totalPages changed from ${expectedTotalPages} to ${result.page.totalPages}`,
      })
    }

    if (expectedTotalPages === 0 && result.page.positions.length > 0) {
      throw new AdapterError({
        statusCode: 502,
        message: 'AMINA returned positions with totalPages=0',
      })
    }

    positions.push(...result.page.positions)

    if (result.page.last) {
      if (expectedTotalPages > 0 && pageNo + 1 < expectedTotalPages) {
        throw new AdapterError({
          statusCode: 502,
          message: `AMINA last=true before totalPages (page ${pageNo}, totalPages ${expectedTotalPages})`,
        })
      }
      completed = true
      break
    }

    if (pageNo + 1 >= expectedTotalPages) {
      throw new AdapterError({
        statusCode: 502,
        message: `AMINA paging ended before last=true (page ${pageNo}, totalPages ${expectedTotalPages})`,
      })
    }
  }

  if (!completed) {
    throw new AdapterError({
      statusCode: 502,
      message: `AMINA pagination exceeded ${MAX_PAGES} pages`,
    })
  }

  if (firstPageRequestedUnixMs === undefined || lastPageReceivedUnixMs === undefined) {
    throw new AdapterError({
      statusCode: 502,
      message: 'AMINA positions response has no timestamps',
    })
  }

  return {
    positions,
    firstPageRequestedUnixMs,
    lastPageReceivedUnixMs,
  }
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
