import nock from 'nock'

type JsonRpcPayload = {
  id: number
  method: string
  params: Array<{ to: string; data: string }>
  jsonrpc: '2.0'
}

export const XUSD_CONTRACT_ADDRESS = '0xE2Fc85BfB48C4cF147921fBE110cf92Ef9f26F94'
export const ROUND_FUNCTION_SELECTOR = '0x146ca531'

// Sample round value in hex (represents 1e18 - a realistic exchange rate value)
export const MOCK_ROUND_VALUE_HEX =
  '0x0000000000000000000000000000000000000000000000000de0b6b3a7640000'
export const MOCK_ROUND_VALUE_DECIMAL = '1000000000000000000'

const bigintToEthRpcResult = (value: bigint): string => {
  return '0x' + value.toString(16).padStart(64, '0')
}

export const mockEthereumRpcSuccess = (roundValueHex: string = MOCK_ROUND_VALUE_HEX): nock.Scope =>
  nock('http://localhost:8545', {})
    .post('/', (body: any) => Array.isArray(body))
    .reply(
      200,
      (_uri, requestBody: JsonRpcPayload[]) => {
        return requestBody.map((request: JsonRpcPayload) => {
          if (request.method === 'eth_chainId') {
            return {
              jsonrpc: '2.0',
              id: request.id,
              result: bigintToEthRpcResult(1n),
            }
          } else if (request.method === 'eth_call') {
            const [{ to, data }] = request.params
            if (
              to.toLowerCase() === XUSD_CONTRACT_ADDRESS.toLowerCase() &&
              data === ROUND_FUNCTION_SELECTOR
            ) {
              return {
                jsonrpc: '2.0',
                id: request.id,
                result: roundValueHex,
              }
            }
          }
          console.log('Unmocked Ethereum RPC request:', JSON.stringify(request, null, 2))
          return {
            jsonrpc: '2.0',
            id: request.id,
            result: '',
          }
        })
      },
      ['Content-Type', 'application/json', 'Connection', 'close'],
    )
    .persist()

export const mockEthereumRpcSingleRequest = (
  roundValueHex: string = MOCK_ROUND_VALUE_HEX,
): nock.Scope =>
  nock('http://localhost:8545', {})
    .post('/', (body: any) => !Array.isArray(body))
    .reply(
      200,
      (_uri, requestBody: JsonRpcPayload) => {
        const request = requestBody
        if (request.method === 'eth_chainId') {
          return {
            jsonrpc: '2.0',
            id: request.id,
            result: bigintToEthRpcResult(1n),
          }
        } else if (request.method === 'eth_call') {
          const [{ to, data }] = request.params
          if (
            to.toLowerCase() === XUSD_CONTRACT_ADDRESS.toLowerCase() &&
            data === ROUND_FUNCTION_SELECTOR
          ) {
            return {
              jsonrpc: '2.0',
              id: request.id,
              result: roundValueHex,
            }
          }
        }
        console.log('Unmocked single Ethereum RPC request:', JSON.stringify(request, null, 2))
        return {
          jsonrpc: '2.0',
          id: request.id,
          result: '',
        }
      },
      ['Content-Type', 'application/json', 'Connection', 'close'],
    )
    .persist()

export const mockEthereumRpcFailure = (): nock.Scope =>
  nock('http://localhost:8545', {})
    .post('/')
    .reply(500, { error: 'Internal Server Error' })
    .persist()

export const mockEthereumRpcContractError = (): nock.Scope =>
  nock('http://localhost:8545', {})
    .post('/', (body: any) => Array.isArray(body))
    .reply(
      200,
      (_uri, requestBody: JsonRpcPayload[]) => {
        return requestBody.map((request: JsonRpcPayload) => {
          if (request.method === 'eth_chainId') {
            return {
              jsonrpc: '2.0',
              id: request.id,
              result: bigintToEthRpcResult(1n),
            }
          } else if (request.method === 'eth_call') {
            return {
              jsonrpc: '2.0',
              id: request.id,
              error: {
                code: -32000,
                message: 'execution reverted',
              },
            }
          }
          return {
            jsonrpc: '2.0',
            id: request.id,
            result: '',
          }
        })
      },
      ['Content-Type', 'application/json', 'Connection', 'close'],
    )
    .persist()

export const mockEthereumRpcContractErrorSingle = (): nock.Scope =>
  nock('http://localhost:8545', {})
    .post('/', (body: any) => !Array.isArray(body))
    .reply(
      200,
      (_uri, requestBody: JsonRpcPayload) => {
        const request = requestBody
        if (request.method === 'eth_chainId') {
          return {
            jsonrpc: '2.0',
            id: request.id,
            result: bigintToEthRpcResult(1n),
          }
        } else if (request.method === 'eth_call') {
          return {
            jsonrpc: '2.0',
            id: request.id,
            error: {
              code: -32000,
              message: 'execution reverted',
            },
          }
        }
        return {
          jsonrpc: '2.0',
          id: request.id,
          result: '',
        }
      },
      ['Content-Type', 'application/json', 'Connection', 'close'],
    )
    .persist()
