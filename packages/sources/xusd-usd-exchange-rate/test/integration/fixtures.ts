import nock from 'nock'

export const mockRpcUrl = 'http://localhost:8545'

const ETH_CALL_REQUEST = {
  jsonrpc: '2.0',
  method: 'eth_call',
  params: [
    {
      to: '0xE2Fc85BfB48C4cF147921fBE110cf92Ef9f26F94',
      data: '0x146ca531',
    },
    'latest',
  ],
  id: 1,
}

export const mockResponseSuccess = (): nock.Scope =>
  nock(mockRpcUrl).post('/', ETH_CALL_REQUEST).reply(
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
    .post('/', ETH_CALL_REQUEST)
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
  nock(mockRpcUrl).post('/', ETH_CALL_REQUEST).reply(
    200,
    {
      jsonrpc: '2.0',
      id: 1,
    },
    ['Content-Type', 'application/json'],
  )

export const mockResponseServerError = (): nock.Scope =>
  nock(mockRpcUrl).post('/', ETH_CALL_REQUEST).reply(500, 'Internal Server Error')
