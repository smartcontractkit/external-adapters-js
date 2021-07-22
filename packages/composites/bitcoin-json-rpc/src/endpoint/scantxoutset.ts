import JSONRPC from '@chainlink/json-rpc-adapter'
import { Config, ExecuteWithConfig } from '@chainlink/types'
import { Validator, Requester } from '@chainlink/ea-bootstrap'

export const NAME = 'scantxoutset'

const inputParams = {
  scanobjects: ['addresses', 'scanobjects'],
  confirmations: false,
}

export const execute: ExecuteWithConfig<Config> = async (request, context, config) => {
  const validator = new Validator(request, inputParams)
  if (validator.error) throw validator.error

  const jobRunID = validator.validated.id
  const scanobjects = validator.validated.data.scanobjects.map((address: string) => {
    // Addresses must be formatted as addr(39e7mxbeNmRRnjfy1qkphv1TiMcztZ8VuE)
    if (address.substr(0, 4) == 'addr') return address
    return `addr(${address})`
  })

  const params = {
    action: 'start',
    scanobjects,
  }

  const response = await JSONRPC.execute(
    {
      ...request,
      data: { ...request.data, method: NAME, params },
    },
    context,
    config,
  )

  response.data.result = String(
    Requester.validateResultNumber(response.data, ['result', 'total_amount']),
  )
  return Requester.success(jobRunID, response)
}
