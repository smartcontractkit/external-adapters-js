import { HttpTransport } from '@chainlink/external-adapter-framework/transports'
import { BaseEndpointTypes } from '../endpoint/round'

export const XUSD_CONTRACT_ADDRESS = '0xE2Fc85BfB48C4cF147921fBE110cf92Ef9f26F94'
export const ROUND_FUNCTION_SELECTOR = '0x146ca531'

export interface JsonRpcRequest {
  jsonrpc: string
  method: string
  params: [{ to: string; data: string }, string]
  id: number
}

export interface JsonRpcResponse {
  jsonrpc: string
  id: number
  result?: string
  error?: {
    code: number
    message: string
  }
}

export type HttpTransportTypes = BaseEndpointTypes & {
  Provider: {
    RequestBody: JsonRpcRequest
    ResponseBody: JsonRpcResponse
  }
}

export type RequestParams = Record<string, never>

export interface PreparedRequest {
  params: RequestParams[]
  request: {
    baseURL: string
    url: string
    method: string
    headers: Record<string, string>
    data: JsonRpcRequest
  }
}

export const buildEthCallRequest = (rpcUrl: string): PreparedRequest['request'] => ({
  baseURL: rpcUrl,
  url: '',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  data: {
    jsonrpc: '2.0',
    method: 'eth_call',
    params: [
      {
        to: XUSD_CONTRACT_ADDRESS,
        data: ROUND_FUNCTION_SELECTOR,
      },
      'latest',
    ],
    id: 1,
  },
})

export const parseHexToInt = (hexValue: string): number => {
  return parseInt(hexValue, 16)
}

export const buildErrorResponse = (param: RequestParams, errorMessage: string) => ({
  params: param,
  response: {
    errorMessage,
    statusCode: 502,
  },
})

export const buildSuccessResponse = (param: RequestParams, result: number) => ({
  params: param,
  response: {
    result,
    data: {
      result,
    },
  },
})

export const httpTransport = new HttpTransport<HttpTransportTypes>({
  prepareRequests: (params, config) => {
    return params.map((param) => ({
      params: [param],
      request: buildEthCallRequest(config.ETHEREUM_RPC_URL),
    }))
  },
  parseResponse: (params, response) => {
    if (response.data.error) {
      return params.map((param) =>
        buildErrorResponse(param, `RPC error: ${response.data.error?.message}`),
      )
    }

    if (!response.data.result) {
      return params.map((param) => buildErrorResponse(param, 'No result returned from eth_call'))
    }

    const result = parseHexToInt(response.data.result)

    return params.map((param) => buildSuccessResponse(param, result))
  },
})
