import nock from 'nock'

export const mockRpcUrl = 'http://localhost:8545'

const XUSD_CONTRACT_ADDRESS = '0xE2Fc85BfB48C4cF147921fBE110cf92Ef9f26F94'
const ROUND_FUNCTION_SELECTOR = '0x146ca531'

const isRoundRequest = (body: Record<string, unknown>): boolean => {
  if (body.method !== 'eth_call') return false
  const params = body.params as Array<{ to: string; data: string }>
  if (!params || params.length < 1) return false
  const { to, data } = params[0]
  return (
    to.toLowerCase() === XUSD_CONTRACT_ADDRESS.toLowerCase() && data === ROUND_FUNCTION_SELECTOR
  )
}

export const mockResponseSuccess = (): nock.Scope =>
  nock(mockRpcUrl)
    .post('/', (body) => isRoundRequest(body))
    .reply(
      200,
      {
        jsonrpc: '2.0',
        id: 1,
        result: '0x0000000000000000000000000000000000000000000000000000000000000121',
      },
      ['Content-Type', 'application/json'],
    )

export const mockResponseRpcError = (): nock.Scope =>
  nock(mockRpcUrl)
    .post('/', (body) => isRoundRequest(body))
    .reply(
      200,
      {
        jsonrpc: '2.0',
        id: 1,
        error: {
          code: -32000,
          message: 'execution reverted',
        },
      },
      ['Content-Type', 'application/json'],
    )

export const mockResponseNoResult = (): nock.Scope =>
  nock(mockRpcUrl)
    .post('/', (body) => isRoundRequest(body))
    .reply(
      200,
      {
        jsonrpc: '2.0',
        id: 1,
      },
      ['Content-Type', 'application/json'],
    )

export const mockResponseServerError = (): nock.Scope =>
  nock(mockRpcUrl)
    .post('/', (body) => isRoundRequest(body))
    .reply(500, 'Internal Server Error')
