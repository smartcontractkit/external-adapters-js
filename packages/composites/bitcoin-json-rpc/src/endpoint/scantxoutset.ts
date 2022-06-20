import * as JSONRPC from '@chainlink/json-rpc-adapter'
import type {
  ExecuteWithConfig,
  AdapterRequest,
  AdapterContext,
  InputParameters,
} from '@chainlink/ea-bootstrap'
import {
  Validator,
  Requester,
  Logger,
  util,
  AdapterTimeoutError,
  AdapterDataProviderError,
} from '@chainlink/ea-bootstrap'
import { ExtendedConfig } from '../config'

export const NAME = 'scantxoutset'
export const supportedEndpoints = [NAME, 'scan', 'scanobject']
export const description = `Calls \`"method": "scantxoutset"\` on the Bitcoin node and returns the total balance of all supplied addresses.

**NOTE:** Requests to this endpoint may exceed the configured \`API_TIMEOUT\`. If a scan in progress, the adapter will wait an additional \`API_TIMEOUT\` period for the in-progress scan to complete. If the timeout is hit while a scan is in progress, a request to abort the scan is sent with an additional 1s timeout. This makes the theoretically maximum timeout for requests to this endpoint \`2 x API_TIMEOUT + 1000\` ms.`

export type TInputParameters = {
  scanobjects: string[]
  confirmations?: string
}

export const inputParameters: InputParameters<TInputParameters> = {
  scanobjects: {
    aliases: ['addresses'],
    required: true,
  },
  confirmations: {
    required: false,
  },
}

type Params = {
  action: string
  scanobjects: string[]
}

export const execute: ExecuteWithConfig<ExtendedConfig> = async (request, context, config) => {
  const validator = new Validator(request, inputParameters)
  const jobRunID = validator.validated.id
  const scanobjects = validator.validated.data.scanobjects.map((address: string) => {
    // Addresses must be formatted as addr(39e7mxbeNmRRnjfy1qkphv1TiMcztZ8VuE)
    if (address.substr(0, 4) == 'addr') return address
    return `addr(${address})`
  })

  const params: Params = {
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
  params: Params,
  request: AdapterRequest,
  context: AdapterContext,
  config: ExtendedConfig,
) => {
  const requestData = {
    ...request,
    data: {
      ...(request.data as JSONRPC.types.request.TInputParameters),
      method: NAME,
      params,
      endpoint: 'request',
    },
  }

  const deadline = Date.now() + (config.api?.timeout ?? 0)
  const _execute = JSONRPC.makeExecute(config)

  while (Date.now() + 1000 <= deadline) {
    try {
      return await _execute(requestData, context)
    } catch (e) {
      const error = e as any
      if (error.cause?.response?.data?.error?.code === -8) {
        Logger.debug('scan is already in progress, waiting 1s...')
        Logger.debug(`time left to wait: ${deadline - Date.now()}ms`)
        await util.sleep(1000)
        continue
      } else if (error.message === `timeout of ${config.api?.timeout}ms exceeded`) {
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
          await _execute(requestData, context)
        } catch (e) {
          const error = e as Error
          Logger.error(`failed to abort scan in progress: ${error.message}`)
        }
      }

      throw new AdapterDataProviderError({
        network: 'bitcoin',
        message: util.mapRPCErrorMessage(e?.code, e?.message),
        cause: e,
      })
    }
  }

  throw new AdapterTimeoutError({
    jobRunID: request.id,
    message: 'unable to start query within timeout',
  })
}
