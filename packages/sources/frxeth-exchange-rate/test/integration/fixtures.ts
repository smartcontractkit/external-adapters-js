import nock from 'nock'

type JsonRpcPayload = {
  id: number
  method: string
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  params: Array<any> | Record<string, any>
  jsonrpc: '2.0'
}

export const mockRpc = (rpcUrl: string): nock.Scope => {
  return (
    nock(rpcUrl, { encodedQueryParams: true })
      .persist()
      // Fetch chain ID
      .post('/', { method: 'eth_chainId', params: [], id: /^\d+$/, jsonrpc: '2.0' })
      .reply(
        200,
        (_, request: JsonRpcPayload) => ({ jsonrpc: '2.0', id: request.id, result: '0x1' }),
        ['Content-Type', 'application/json'],
      )
      // Call getPrices on frxETH-ETH contract
      .post('/', {
        method: 'eth_call',
        params: [
          { to: '0xb12c19c838499e3447afd9e59274b1be56b1546a', data: '0xbd9a548b' },
          'latest',
        ],
        id: /^\d+$/,
        jsonrpc: '2.0',
      })
      .reply(
        200,
        (_, request: JsonRpcPayload) => ({
          jsonrpc: '2.0',
          id: request['id'],
          result:
            '0x00000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000ddc742e8e0abb900000000000000000000000000000000000000000000000000de0b6b3a7640000',
        }),
        ['Content-Type', 'application/json'],
      )
  )
}
