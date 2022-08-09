import { AxiosRequestConfig, Requester, Validator } from '@chainlink/ea-bootstrap'
import { ExecuteWithConfig, InputParameters } from '@chainlink/ea-bootstrap'
import { DEFAULT_BASE_URL, ExtendedConfig } from '../config'

export const supportedEndpoints = ['request']

export type TInputParameters = {
  url?: string
  method: string
  params: string[] | Record<string, unknown>
  requestId?: string | number
}
export const inputParameters: InputParameters<TInputParameters> = {
  url: {
    required: false,
  },
  method: {
    required: false,
  },
  params: {
    required: false,
  },
  requestId: {
    required: false,
  },
}

// Export function to integrate with Chainlink node
export const execute: ExecuteWithConfig<ExtendedConfig> = async (request, _, config) => {
  const validator = new Validator(request, inputParameters)

  const jobRunID = validator.validated.id
  const url = config.RPC_URL || validator.validated.data.url || DEFAULT_BASE_URL
  const method = validator.validated.data.method || ''
  const params = validator.validated.data.params
  const requestId = validator.validated.data.requestId || jobRunID

  const data = {
    id: requestId,
    jsonrpc: '2.0',
    method,
    params,
  }

  const options: AxiosRequestConfig = {
    ...config.api,
    url,
    method: 'POST',
    headers: {
      ...config.api?.headers,
      'Content-Type': 'application/json',
    },
    // Remove undefined values
    data: JSON.parse(JSON.stringify(data)),
  }

  const response = await Requester.request<Record<string, unknown>>(options)
  if (response.status >= 400) throw response.data.error

  return Requester.success(request.id, response)
}
