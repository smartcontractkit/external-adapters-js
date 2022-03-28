import * as JSONRPC from '@chainlink/json-rpc-adapter'
import { Config, ExecuteWithConfig, AdapterRequest, AdapterContext } from '@chainlink/types'
import { Validator, Requester, Logger, util } from '@chainlink/ea-bootstrap'

export const NAME = 'scantxoutset'

export const description = `Calls \`"method": "scantxoutset"\` on the Bitcoin node and returns the total balance of all supplied addresses.

**NOTE:** Requests to this endpoint may exceed the configured \`API_TIMEOUT\`. If a scan in progress, the adapter will wait an additional \`API_TIMEOUT\` period for the in-progress scan to complete. If the timeout is hit while a scan is in progress, a request to abort the scan is sent with an additional 1s timeout. This makes the theoretically maximum timeout for requests to this endpoint \`2 x API_TIMEOUT + 1000\` ms.`

const inputParams = {
  scanobjects: ['addresses', 'scanobjects'],
  confirmations: false,
}

export const execute: ExecuteWithConfig<Config> = async (request, context, config) => {
  const validator = new Validator(request, inputParams)

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
  const _execute: ExecuteWithConfig<Config> = JSONRPC.makeExecute()

  while (Date.now() + 1000 <= deadline) {
    try {
      return await _execute(requestData, context, config)
    } catch (e) {
      if (e.cause?.response?.data?.error?.code === -8) {
        Logger.debug('scan is already in progress, waiting 1s...')
        Logger.debug(`time left to wait: ${deadline - Date.now()}ms`)
        await util.sleep(1000)
        continue
      } else if (e.message === `timeout of ${config.api.timeout}ms exceeded`) {
        // Highly experimental:
        // If a timeout error was hit, we try to abort the scan that we initiated
        // However there is a race condition where:
        // 1. this request times out
        // 2. the scan finishes
        // 3. a new scan is initiated by a different request
        // 4. this action aborts the scan
        // However the time between 1. and 4. is minimal, and the likelihood of this happening is low
        requestData.data.params.action = 'abort'
        config.api.timeout = 1000 // We expect this action to be quick, and we do not want to hold up the request on this
        Logger.debug('timeout reached, aborting scan in progress')
        try {
          await _execute(requestData, context, config)
        } catch (e) {
          Logger.error(`failed to abort scan in progress: ${e.message}`)
        }
      }

      throw e
    }
  }

  throw new Error('unable to start query within timeout')
}
