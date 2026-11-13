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
const MAX_QUANTITY = Number.MAX_SAFE_INTEGER / 10_000 // largest exact 4-dp JS number
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

interface PageCheck {
  totalPages: number
  done: boolean
}

interface ScanState {
  pageNo: number
  expectedTotalPages: number
  positions: AminaPosition[]
  firstPageRequestedUnixMs: number
  lastPageReceivedUnixMs: number
  done: boolean
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.length > 0
}

function isNonNegativeInteger(value: unknown): value is number {
  return typeof value === 'number' && Number.isInteger(value) && value >= 0
}

function isFourDecimalQuantity(value: unknown): value is number {
  return (
    typeof value === 'number' &&
    Number.isFinite(value) &&
    value >= 0 &&
    Number(value.toFixed(4)) === value &&
    value <= MAX_QUANTITY
  )
}

function isPosition(value: unknown): value is AminaPosition {
  return isRecord(value) && isNonEmptyString(value.isin) && isFourDecimalQuantity(value.quantity)
}

function isPositionsPage(value: unknown): value is AminaPositionsPage {
  return (
    isRecord(value) &&
    Array.isArray(value.positions) &&
    value.positions.every(isPosition) &&
    isNonNegativeInteger(value.totalPages) &&
    isNonNegativeInteger(value.number) &&
    typeof value.last === 'boolean'
  )
}

function invalid(message: string): AdapterError {
  return new AdapterError({ statusCode: 502, message })
}

function ensure(condition: boolean, message: string): asserts condition {
  if (!condition) {
    throw invalid(message)
  }
}

export function parsePositionsPage(data: unknown): AminaPositionsPage {
  if (!isPositionsPage(data)) {
    throw invalid('AMINA positions response is malformed')
  }
  return {
    positions: data.positions,
    totalPages: data.totalPages,
    number: data.number,
    last: data.last,
  }
}

function checkPage(
  page: AminaPositionsPage,
  pageNo: number,
  expectedTotalPages?: number,
): PageCheck {
  ensure(page.number === pageNo, `AMINA returned page ${page.number} for requested page ${pageNo}`)

  const totalPages = expectedTotalPages ?? page.totalPages
  ensure(
    expectedTotalPages !== undefined || totalPages <= MAX_PAGES,
    `AMINA totalPages ${totalPages} exceeds ${MAX_PAGES} pages`,
  )
  ensure(
    expectedTotalPages === undefined || page.totalPages === expectedTotalPages,
    `AMINA totalPages changed from ${expectedTotalPages} to ${page.totalPages}`,
  )
  ensure(
    !(totalPages === 0 && page.positions.length > 0),
    'AMINA returned positions with totalPages=0',
  )
  ensure(
    !(page.last && totalPages > 0 && pageNo + 1 < totalPages),
    `AMINA last=true before totalPages (page ${pageNo}, totalPages ${totalPages})`,
  )
  ensure(
    page.last || pageNo + 1 < totalPages,
    `AMINA paging ended before last=true (page ${pageNo}, totalPages ${totalPages})`,
  )

  return { totalPages, done: page.last }
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

async function readPage(args: FetchPositionsArgs, state: ScanState): Promise<void> {
  const result = await fetchPage(args, state.pageNo)
  state.lastPageReceivedUnixMs = result.receivedUnixMs

  const pageCheck = checkPage(result.page, state.pageNo, state.expectedTotalPages)
  state.expectedTotalPages = pageCheck.totalPages
  state.positions.push(...result.page.positions)
  state.done = pageCheck.done
  state.pageNo += 1
}

// AMINA returns `last` per page, so page N+1 depends on page N.
// HttpTransport.prepareRequests prepares requests up front and cannot chain
// them; SubscriptionTransport is the framework seam for this custom flow.
export async function fetchAllPositions(args: FetchPositionsArgs): Promise<PositionsResult> {
  const first = await fetchPage(args, 0)
  const firstCheck = checkPage(first.page, 0)
  const state: ScanState = {
    pageNo: 1,
    expectedTotalPages: firstCheck.totalPages,
    positions: [...first.page.positions],
    firstPageRequestedUnixMs: first.requestedUnixMs,
    lastPageReceivedUnixMs: first.receivedUnixMs,
    done: firstCheck.done,
  }
  while (!state.done) {
    await readPage(args, state)
  }

  return {
    positions: state.positions,
    firstPageRequestedUnixMs: state.firstPageRequestedUnixMs,
    lastPageReceivedUnixMs: state.lastPageReceivedUnixMs,
  }
}

export function selectQuantity(positions: AminaPosition[], isin: string): number {
  const matches = positions.filter((position) => position.isin === isin)
  ensure(matches.length > 0, `No AMINA position found for ISIN ${isin}`)
  ensure(
    matches.length === 1,
    `Duplicate AMINA position found for ISIN ${isin} (${matches.length} matches)`,
  )
  return matches[0].quantity
}
