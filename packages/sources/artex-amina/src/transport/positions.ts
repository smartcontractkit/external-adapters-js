import type { EndpointContext } from '@chainlink/external-adapter-framework/adapter'
import { calculateHttpRequestKey } from '@chainlink/external-adapter-framework/cache'
import type { Requester } from '@chainlink/external-adapter-framework/util/requester'
import {
  AdapterDataProviderError,
  AdapterError,
} from '@chainlink/external-adapter-framework/validation/error'
import type { BaseEndpointTypes } from '../endpoint/por'
import type { AuthManager } from './auth'
import { positionsPath, trimEndpoint } from './paths'
import { DEFAULT_RETRY, withRetry } from './retry'
import { buildSignedGetHeaders } from './signing'

const PAGE_SIZE = 2000 // Manual max
const MAX_PAGES = 100 // cap a bad totalPages
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
  context: EndpointContext<BaseEndpointTypes>
  transportName: string
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
    Number(value.quantity.toFixed(4)) === value.quantity &&
    value.quantity <= Number.MAX_SAFE_INTEGER / 10_000
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

interface PageCheck {
  totalPages: number
  done: boolean
}

function checkPage(
  page: AminaPositionsPage,
  pageNo: number,
  expectedTotalPages?: number,
): PageCheck {
  if (page.number !== pageNo) {
    throw invalid(`AMINA returned page ${page.number} for requested page ${pageNo}`)
  }

  const totalPages = expectedTotalPages ?? page.totalPages
  if (expectedTotalPages === undefined && totalPages > MAX_PAGES) {
    throw invalid(`AMINA totalPages ${totalPages} exceeds ${MAX_PAGES} pages`)
  }
  if (expectedTotalPages !== undefined && page.totalPages !== expectedTotalPages) {
    throw invalid(`AMINA totalPages changed from ${expectedTotalPages} to ${page.totalPages}`)
  }

  if (totalPages === 0 && page.positions.length > 0) {
    throw invalid('AMINA returned positions with totalPages=0')
  }

  if (page.last && totalPages > 0 && pageNo + 1 < totalPages) {
    throw invalid(`AMINA last=true before totalPages (page ${pageNo}, totalPages ${totalPages})`)
  }
  if (page.last) {
    return { totalPages, done: true }
  }

  if (pageNo + 1 >= totalPages) {
    throw invalid(`AMINA paging ended before last=true (page ${pageNo}, totalPages ${totalPages})`)
  }

  return { totalPages, done: false }
}

async function fetchPage(args: FetchPositionsArgs, pageNo: number): Promise<PageResult> {
  const { requester, auth, settings, portfolioNo, context, transportName } = args
  const uri = positionsPath(portfolioNo)
  const requestKey = calculateHttpRequestKey({
    context,
    data: { portfolioNo, pageNo },
    transportName,
  })

  const makeRequest = (token: string) =>
    requester.request<unknown>(requestKey, {
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

  const requestPage = (token: string) => withRetry(() => makeRequest(token), DEFAULT_RETRY)

  const token = await auth.getAccessToken()
  let result: Awaited<ReturnType<typeof makeRequest>>
  try {
    result = await requestPage(token)
  } catch (error) {
    if (!(error instanceof AdapterDataProviderError && error.providerStatusCode === 401)) {
      // Let the transport map it: the original error carries the provider
      // request/receive timestamps that the 502 response must preserve.
      throw error
    }
    result = await requestPage(await auth.refreshAfter401())
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

  for (let pageNo = 0; pageNo < MAX_PAGES; pageNo++) {
    const result = await fetchPage(args, pageNo)
    firstPageRequestedUnixMs ??= result.requestedUnixMs
    lastPageReceivedUnixMs = result.receivedUnixMs

    const pageCheck = checkPage(result.page, pageNo, expectedTotalPages)
    expectedTotalPages = pageCheck.totalPages
    positions.push(...result.page.positions)

    if (pageCheck.done) {
      if (firstPageRequestedUnixMs === undefined || lastPageReceivedUnixMs === undefined) {
        throw invalid('AMINA positions response has no timestamps')
      }
      return { positions, firstPageRequestedUnixMs, lastPageReceivedUnixMs }
    }
  }

  throw invalid(`AMINA pagination exceeded ${MAX_PAGES} pages`)
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
