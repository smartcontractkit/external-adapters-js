import {
  buildErrorResponse,
  buildEthCallRequest,
  buildSuccessResponse,
  parseHexToInt,
  RequestParams,
  ROUND_FUNCTION_SELECTOR,
  XUSD_CONTRACT_ADDRESS,
} from '../../src/transport/round'

describe('buildEthCallRequest', () => {
  it('should build request with correct RPC URL as baseURL', () => {
    const rpcUrl = 'https://eth-mainnet.example.com/v1/abc123'
    const request = buildEthCallRequest(rpcUrl)

    expect(request.baseURL).toBe(rpcUrl)
  })

  it('should build request with empty url path', () => {
    const request = buildEthCallRequest('https://eth.example.com')

    expect(request.url).toBe('')
  })

  it('should build request with POST method', () => {
    const request = buildEthCallRequest('https://eth.example.com')

    expect(request.method).toBe('POST')
  })

  it('should build request with Content-Type application/json header', () => {
    const request = buildEthCallRequest('https://eth.example.com')

    expect(request.headers['Content-Type']).toBe('application/json')
  })

  it('should build request with jsonrpc version 2.0', () => {
    const request = buildEthCallRequest('https://eth.example.com')

    expect(request.data.jsonrpc).toBe('2.0')
  })

  it('should build request with eth_call method', () => {
    const request = buildEthCallRequest('https://eth.example.com')

    expect(request.data.method).toBe('eth_call')
  })

  it('should build request targeting XUSD contract address', () => {
    const request = buildEthCallRequest('https://eth.example.com')

    expect(request.data.params[0].to).toBe(XUSD_CONTRACT_ADDRESS)
  })

  it('should build request with round function selector as data', () => {
    const request = buildEthCallRequest('https://eth.example.com')

    expect(request.data.params[0].data).toBe(ROUND_FUNCTION_SELECTOR)
  })

  it('should build request targeting latest block', () => {
    const request = buildEthCallRequest('https://eth.example.com')

    expect(request.data.params[1]).toBe('latest')
  })

  it('should build request with id 1', () => {
    const request = buildEthCallRequest('https://eth.example.com')

    expect(request.data.id).toBe(1)
  })
})

describe('parseHexToInt', () => {
  it('should parse hex string 0x121 to 289', () => {
    const result = parseHexToInt(
      '0x0000000000000000000000000000000000000000000000000000000000000121',
    )

    expect(result).toBe(289)
  })

  it('should parse hex string 0x0 to 0', () => {
    const result = parseHexToInt('0x0')

    expect(result).toBe(0)
  })

  it('should parse hex string 0x1 to 1', () => {
    const result = parseHexToInt('0x1')

    expect(result).toBe(1)
  })

  it('should parse hex string 0xff to 255', () => {
    const result = parseHexToInt('0xff')

    expect(result).toBe(255)
  })

  it('should parse hex string 0x100 to 256', () => {
    const result = parseHexToInt('0x100')

    expect(result).toBe(256)
  })

  it('should parse large hex value correctly', () => {
    const result = parseHexToInt('0xffffffff')

    expect(result).toBe(4294967295)
  })
})

describe('buildErrorResponse', () => {
  const mockParam: RequestParams = {}

  it('should return response with params matching input param', () => {
    const response = buildErrorResponse(mockParam, 'test error')

    expect(response.params).toBe(mockParam)
  })

  it('should return response with errorMessage matching input message', () => {
    const errorMessage = 'RPC error: execution reverted'
    const response = buildErrorResponse(mockParam, errorMessage)

    expect(response.response.errorMessage).toBe(errorMessage)
  })

  it('should return response with statusCode 502', () => {
    const response = buildErrorResponse(mockParam, 'any error')

    expect(response.response.statusCode).toBe(502)
  })
})

describe('buildSuccessResponse', () => {
  const mockParam: RequestParams = {}

  it('should return response with params matching input param', () => {
    const response = buildSuccessResponse(mockParam, 289)

    expect(response.params).toBe(mockParam)
  })

  it('should return response with result in response.result', () => {
    const result = 289
    const response = buildSuccessResponse(mockParam, result)

    expect(response.response.result).toBe(result)
  })

  it('should return response with result in response.data.result', () => {
    const result = 289
    const response = buildSuccessResponse(mockParam, result)

    expect(response.response.data.result).toBe(result)
  })

  it('should handle result of 0', () => {
    const response = buildSuccessResponse(mockParam, 0)

    expect(response.response.result).toBe(0)
    expect(response.response.data.result).toBe(0)
  })

  it('should handle large result values', () => {
    const result = 4294967295
    const response = buildSuccessResponse(mockParam, result)

    expect(response.response.result).toBe(result)
    expect(response.response.data.result).toBe(result)
  })
})
