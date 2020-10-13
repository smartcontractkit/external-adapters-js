import { Requester, Validator } from '@chainlink/external-adapter'
import { AdapterRequest, AdapterResponse } from '@chainlink/types'

const inputParams = {
  url: false,
  method: false,
  params: false,
}

// Export function to integrate with Chainlink node
export const execute = async (request: AdapterRequest): Promise<AdapterResponse> => {
  const validator = new Validator(request, inputParams)
  if (validator.error) return { statusCode: validator.error.statusCode, data: validator.error }

  const url = process.env.RPC_URL || validator.validated.data.url || 'http://localhost:8545'
  const method = validator.validated.data.method || ''
  const params = validator.validated.data.params

  const data = {
    id: request.id,
    jsonrpc: '2.0',
    method,
    params,
  }

  const options = {
    url,
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    // Remove undefined values
    data: JSON.parse(JSON.stringify(data)),
  }

  try {
    const response = await Requester.request(options)
    if (response.statusCode >= 400)
      return {
        statusCode: response.status,
        data: Requester.errored(request.id, response.data.error),
      }

    return {
      statusCode: response.status,
      data: Requester.success(request.id, response),
    }
  } catch (error) {
    return { statusCode: 500, data: Requester.errored(request.id, error) }
  }
}
