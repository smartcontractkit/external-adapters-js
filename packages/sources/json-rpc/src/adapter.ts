import { Requester, Validator } from '@chainlink/external-adapter'
import { Execute } from '@chainlink/types'

const inputParams = {
  url: false,
  method: false,
  params: false,
}

// Export function to integrate with Chainlink node
export const execute: Execute = async (request) => {
  const validator = new Validator(request, inputParams)
  if (validator.error) throw validator.error

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
    method: 'POST' as any,
    headers: {
      'Content-Type': 'application/json',
    },
    // Remove undefined values
    data: JSON.parse(JSON.stringify(data)),
  }

  const response = await Requester.request(options)
  if (response.status >= 400) throw response.data.error

  return Requester.success(request.id, response)
}
