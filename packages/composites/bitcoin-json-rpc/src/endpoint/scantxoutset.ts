import JSONRPC from '@chainlink/json-rpc-adapter'
import { Config, ExecuteWithConfig, AdapterRequest, AdapterContext } from '@chainlink/types'
import { Validator, Requester, Logger } from '@chainlink/ea-bootstrap'

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

  const response = await scanWithRetries(params, request, context, config)

  response.data.result = String(
    Requester.validateResultNumber(response.data, ['result', 'total_amount']),
  )
  return Requester.success(jobRunID, response)
}

const scanWithRetries = async (
  params: Record<string, unknown>,
  request: AdapterRequest,
  context: AdapterContext,
  config: Config,
) => {
  const requestData = {
    ...request,
    data: { ...request.data, method: NAME, params },
  }

  const deadline = Date.now() + config.api.timeout
  while (Date.now() + 1000 <= deadline) {
    try {
      return await JSONRPC.execute(requestData, context, config)
    } catch (e) {
      if (e.cause?.response?.data?.error?.code !== -8) {
        throw e
      }

      Logger.debug('scan is already in progress, waiting 1s...')
      await sleep(1000)
    }
  }

  throw new Error('unable to start query within timeout')
}

const sleep = (ms: number) => {
  return new Promise((resolve) => setTimeout(resolve, ms))
}
