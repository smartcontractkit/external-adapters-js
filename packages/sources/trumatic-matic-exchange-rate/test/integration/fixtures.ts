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
      // Call sharePrice on truMATIC Vault Shares contract
      .post('/', {
        method: 'eth_call',
        params: [
          { to: '0xa43a7c62d56df036c187e1966c03e2799d8987ed', data: '0x87269729' },
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
            '0x0000000000000000000000001a6c4d6849859b03c94fdb269bd39409df8000000000000000000000000000000000000000000001e2a855fcb3a3b3f96d11b100',
        }),
        ['Content-Type', 'application/json'],
      )
  )
}
