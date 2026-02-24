import nock from 'nock'

type JsonRpcPayload = {
  id: number
  method: string
  params: Array<{ to?: string; data?: string } | string>
  jsonrpc: '2.0'
}

// Test constants
export const INDEX_CONTRACT_ADDRESS = '0x1234567890123456789012345678901234567890'
export const TOKEN_ALLOCATION_ADAPTER_URL = 'http://localhost:8080'
export const DINARI_RPC_URL = 'http://localhost:8545'
export const DINARI_CHAIN_ID = 42161

// Token addresses returned by getAllocations
const TOKEN_1_ADDRESS = '0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa'
const TOKEN_2_ADDRESS = '0xbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb'
const TOKEN_3_ADDRESS = '0xcccccccccccccccccccccccccccccccccccccccc'

// Function signatures (keccak256 hashes of function signatures, first 4 bytes)
const GET_ALLOCATIONS_SIG = '0x65ed6e23' // getAllocations() - confirmed from error logs
const SYMBOL_SIG = '0x95d89b41' // symbol()
const DECIMALS_SIG = '0x313ce567' // decimals()

// Mock balances
const BALANCES = {
  [TOKEN_1_ADDRESS.toLowerCase()]: 1000000000000000000n, // 1 token with 18 decimals
  [TOKEN_2_ADDRESS.toLowerCase()]: 2000000000n, // 2 tokens with 8 decimals
  [TOKEN_3_ADDRESS.toLowerCase()]: 500000000000000000000n, // 500 tokens with 18 decimals
}

// Mock token info
const TOKEN_INFO: Record<string, { symbol: string; decimals: number }> = {
  [TOKEN_1_ADDRESS.toLowerCase()]: { symbol: 'AAPL', decimals: 18 },
  [TOKEN_2_ADDRESS.toLowerCase()]: { symbol: 'GOOGL', decimals: 8 },
  [TOKEN_3_ADDRESS.toLowerCase()]: { symbol: 'MSFT', decimals: 18 },
}

const bigintToEthRpcResult = (value: bigint): string => {
  return '0x' + value.toString(16).padStart(64, '0')
}

const encodeString = (str: string): string => {
  // Encode string for eth_call response (ABI encoded)
  const hex = Buffer.from(str).toString('hex')
  const offset = '0000000000000000000000000000000000000000000000000000000000000020'
  const length = str.length.toString(16).padStart(64, '0')
  const data = hex.padEnd(64, '0')
  return '0x' + offset + length + data
}

const encodeGetAllocationsResponse = (addresses: string[], balances: bigint[]): string => {
  // ABI encode response for getAllocations() returning (address[], uint256[])
  // Format: offset_to_addresses (32 bytes) | offset_to_balances (32 bytes) |
  //         addresses_length (32 bytes) | addresses... | balances_length (32 bytes) | balances...

  // Calculate dynamic offsets
  // First array starts at 0x40 (64 bytes - skip two offset slots)
  const addressesOffset = 64
  // Second array starts after: offset(32) + length(32) + addresses(addresses.length * 32)
  const balancesOffset = addressesOffset + 32 + addresses.length * 32

  let result = ''
  // Offset to addresses array
  result += addressesOffset.toString(16).padStart(64, '0')
  // Offset to balances array
  result += balancesOffset.toString(16).padStart(64, '0')

  // Addresses array: length + elements
  result += addresses.length.toString(16).padStart(64, '0')
  for (const addr of addresses) {
    // Addresses are left-padded with zeros to 32 bytes
    result += addr.slice(2).toLowerCase().padStart(64, '0')
  }

  // Balances array: length + elements
  result += balances.length.toString(16).padStart(64, '0')
  for (const balance of balances) {
    result += balance.toString(16).padStart(64, '0')
  }

  return '0x' + result
}

export const mockRpcResponseSuccess = (): nock.Scope =>
  nock(DINARI_RPC_URL)
    .post('/', (body: JsonRpcPayload | JsonRpcPayload[]) => {
      // Handle both single and batch requests
      return true
    })
    .reply(
      200,
      (_uri, requestBody: JsonRpcPayload | JsonRpcPayload[]) => {
        const requests = Array.isArray(requestBody) ? requestBody : [requestBody]
        const responses = requests.map((request: JsonRpcPayload) => {
          if (request.method === 'eth_chainId') {
            return {
              jsonrpc: '2.0',
              id: request.id,
              result: '0xa4b1', // 42161 in hex
            }
          } else if (request.method === 'eth_call') {
            const params = request.params[0] as { to?: string; data?: string }
            const to = params.to?.toLowerCase()
            const data = params.data

            // getAllocations() call
            if (to === INDEX_CONTRACT_ADDRESS.toLowerCase() && data === GET_ALLOCATIONS_SIG) {
              return {
                jsonrpc: '2.0',
                id: request.id,
                result: encodeGetAllocationsResponse(
                  [TOKEN_1_ADDRESS, TOKEN_2_ADDRESS, TOKEN_3_ADDRESS],
                  [
                    BALANCES[TOKEN_1_ADDRESS.toLowerCase()],
                    BALANCES[TOKEN_2_ADDRESS.toLowerCase()],
                    BALANCES[TOKEN_3_ADDRESS.toLowerCase()],
                  ],
                ),
              }
            }

            // symbol() call
            if (data === SYMBOL_SIG && to) {
              const tokenInfo = TOKEN_INFO[to]
              if (tokenInfo) {
                return {
                  jsonrpc: '2.0',
                  id: request.id,
                  result: encodeString(tokenInfo.symbol),
                }
              }
            }

            // decimals() call
            if (data === DECIMALS_SIG && to) {
              const tokenInfo = TOKEN_INFO[to]
              if (tokenInfo) {
                return {
                  jsonrpc: '2.0',
                  id: request.id,
                  result: bigintToEthRpcResult(BigInt(tokenInfo.decimals)),
                }
              }
            }
          } else if (request.method === 'net_version') {
            return {
              jsonrpc: '2.0',
              id: request.id,
              result: '42161',
            }
          }

          console.log('Unmocked RPC request:', JSON.stringify(request, null, 2))
          return {
            jsonrpc: '2.0',
            id: request.id,
            result: '',
          }
        })

        return Array.isArray(requestBody) ? responses : responses[0]
      },
      ['Content-Type', 'application/json', 'Connection', 'close'],
    )
    .persist()

export const mockRpcResponseEmptyAllocations = (): nock.Scope =>
  nock(DINARI_RPC_URL)
    .post('/', (body: JsonRpcPayload | JsonRpcPayload[]) => true)
    .reply(
      200,
      (_uri, requestBody: JsonRpcPayload | JsonRpcPayload[]) => {
        const requests = Array.isArray(requestBody) ? requestBody : [requestBody]
        const responses = requests.map((request: JsonRpcPayload) => {
          if (request.method === 'eth_chainId') {
            return {
              jsonrpc: '2.0',
              id: request.id,
              result: '0xa4b1',
            }
          } else if (request.method === 'eth_call') {
            const params = request.params[0] as { to?: string; data?: string }
            const to = params.to?.toLowerCase()
            const data = params.data

            // getAllocations() - return empty arrays
            if (to === INDEX_CONTRACT_ADDRESS.toLowerCase() && data === GET_ALLOCATIONS_SIG) {
              return {
                jsonrpc: '2.0',
                id: request.id,
                result: encodeGetAllocationsResponse([], []),
              }
            }
          } else if (request.method === 'net_version') {
            return {
              jsonrpc: '2.0',
              id: request.id,
              result: '42161',
            }
          }

          return {
            jsonrpc: '2.0',
            id: request.id,
            result: '',
          }
        })

        return Array.isArray(requestBody) ? responses : responses[0]
      },
      ['Content-Type', 'application/json', 'Connection', 'close'],
    )
    .persist()

export const mockRpcResponseFailure = (): nock.Scope =>
  nock(DINARI_RPC_URL)
    .post('/', () => true)
    .reply(
      200,
      (_uri, requestBody: JsonRpcPayload | JsonRpcPayload[]) => {
        const requests = Array.isArray(requestBody) ? requestBody : [requestBody]
        const responses = requests.map((request: JsonRpcPayload) => {
          if (request.method === 'eth_chainId') {
            return {
              jsonrpc: '2.0',
              id: request.id,
              result: '0xa4b1',
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
          } else if (request.method === 'net_version') {
            return {
              jsonrpc: '2.0',
              id: request.id,
              result: '42161',
            }
          }

          return {
            jsonrpc: '2.0',
            id: request.id,
            result: '',
          }
        })

        return Array.isArray(requestBody) ? responses : responses[0]
      },
      ['Content-Type', 'application/json', 'Connection', 'close'],
    )
    .persist()

export const mockTokenAllocationAdapterSuccess = (): nock.Scope =>
  nock(TOKEN_ALLOCATION_ADAPTER_URL)
    .post('/', (body) => {
      // Match POST requests to token-allocation adapter
      return body.data?.allocations && body.data?.quote === 'USD'
    })
    .reply(
      200,
      {
        data: {
          result: 12345.67,
        },
        result: 12345.67,
        statusCode: 200,
      },
      ['Content-Type', 'application/json', 'Connection', 'close'],
    )
    .persist()

export const mockTokenAllocationAdapterFailure = (): nock.Scope =>
  nock(TOKEN_ALLOCATION_ADAPTER_URL)
    .post('/', (body) => {
      return body.data?.allocations && body.data?.quote === 'USD'
    })
    .reply(
      500,
      {
        error: 'Internal server error',
        statusCode: 500,
      },
      ['Content-Type', 'application/json', 'Connection', 'close'],
    )
    .persist()

export const mockTokenAllocationAdapterInvalidResponse = (): nock.Scope =>
  nock(TOKEN_ALLOCATION_ADAPTER_URL)
    .post('/', (body) => {
      return body.data?.allocations && body.data?.quote === 'USD'
    })
    .reply(
      200,
      {
        // Missing result field
        data: {},
        statusCode: 200,
      },
      ['Content-Type', 'application/json', 'Connection', 'close'],
    )
    .persist()
