import { EndpointContext } from '@chainlink/external-adapter-framework/adapter'
import { calculateHttpRequestKey } from '@chainlink/external-adapter-framework/cache'
import { Requester } from '@chainlink/external-adapter-framework/util/requester'
import {
  AdapterDataProviderError,
  AdapterError,
} from '@chainlink/external-adapter-framework/validation/error'
import { BaseEndpointTypes } from '../endpoint/reserve'
import { TokenManager } from './auth'
import { buildPositionHeaders } from './authentication'

// The page size of the positions request. The provider documents no maximum.
export const PAGE_SIZE = 20

export interface Position {
  isin: string
  quantity: number
}

export interface PositionsReply {
  positions: Position[]
  totalPages: number
  last: boolean
}

export const positionsPath = (portfolio: string): string =>
  `/api/b2c/v1/securities/portfolios/${portfolio}/positions`

const invalidReply = (): AdapterError =>
  new AdapterError({
    statusCode: 502,
    message: 'The provider returned an unusable positions reply',
  })

/**
 * Reads one page of the positions of a portfolio. Every page is a new signed
 * request. When the provider rejects the bearer token with 401 the page is
 * replayed once with a renewed token, which carries a new nonce, a new
 * timestamp and a new signature.
 */
export const fetchPositionsPage = async (
  requester: Requester,
  context: EndpointContext<BaseEndpointTypes>,
  transportName: string,
  tokens: TokenManager,
  portfolio: string,
  page: number,
): Promise<PositionsReply> => {
  const path = positionsPath(portfolio)
  // The requester sends one request for each key and gives its reply to every
  // caller with the same key. The key names the input of the request; it holds
  // no secret, time or nonce.
  const requestKey = calculateHttpRequestKey<BaseEndpointTypes>({
    context,
    data: { portfolio, page, size: PAGE_SIZE },
    transportName,
  })

  const send = async (accessToken: string) =>
    requester.request<PositionsReply>(requestKey, {
      baseURL: context.adapterSettings.API_ENDPOINT,
      url: path,
      method: 'GET',
      params: { page, size: PAGE_SIZE },
      headers: buildPositionHeaders({
        path,
        accessToken,
        settings: context.adapterSettings,
      }),
    })

  // A login or refresh failure is not a page failure: it propagates as the auth
  // error and never reaches the page 401 handling below.
  const accessToken = await tokens.getAccessToken()

  let response
  try {
    response = await send(accessToken)
  } catch (error) {
    if ((error as AdapterDataProviderError).providerStatusCode !== 401) {
      throw error
    }
    response = await send(await tokens.renew())
  }

  const reply = response.response?.data
  if (
    !Array.isArray(reply?.positions) ||
    typeof reply?.totalPages !== 'number' ||
    typeof reply?.last !== 'boolean'
  ) {
    throw invalidReply()
  }

  return reply
}

/**
 * Reads the positions of a portfolio until the provider marks a page as the
 * last one or the page number reaches the total that the provider reports.
 */
export const fetchAllPositions = async (
  requester: Requester,
  context: EndpointContext<BaseEndpointTypes>,
  transportName: string,
  tokens: TokenManager,
  portfolio: string,
): Promise<Position[]> => {
  const positions: Position[] = []
  let page = 0
  let done = false

  while (!done) {
    const reply = await fetchPositionsPage(
      requester,
      context,
      transportName,
      tokens,
      portfolio,
      page,
    )
    positions.push(...reply.positions)
    done = reply.last || page + 1 >= reply.totalPages
    page += 1
  }

  return positions
}
