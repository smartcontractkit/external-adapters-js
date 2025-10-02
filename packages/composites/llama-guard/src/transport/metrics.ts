import { AdapterResponse, makeLogger } from '@chainlink/external-adapter-framework/util'
import { Requester } from '@chainlink/external-adapter-framework/util/requester'
import { BaseEndpointTypes } from '../endpoint/nav'

const logger = makeLogger('Metrics')

export const emitMetric = async (
  endpoint: string,
  asset: string,
  response: AdapterResponse<BaseEndpointTypes['Response']>,
  requester: Requester,
) => {
  try {
    await _emitMetric(endpoint, asset, response, requester)
  } catch (e) {
    logger.warn(`Emit metric failed: ${e}`)
  }
}

const _emitMetric = async (
  endpoint: string,
  asset: string,
  response: AdapterResponse<BaseEndpointTypes['Response']>,
  requester: Requester,
) => {
  if (response.data?.isBounded === true) {
    return
  }
  if (endpoint.length === 0) {
    logger.debug('Missing LLAMA_RISK_API_ENDPOINT, skip sending metrics')
    return
  }

  const requestConfig = {
    baseURL: endpoint,
    method: 'POST',
    data: {
      riskFlag: response.data?.riskFlag,
      breachDirection: response.data?.breachDirection,
      isBounded: response.data?.isBounded,
      rawNav: response.data?.rawNav,
      adjustedNav: response.data?.adjustedNav,
      asset_address: asset,
      timestamp: response.timestamps.providerDataReceivedUnixMs,
    },
  }

  await requester.request(JSON.stringify(requestConfig), requestConfig)
}
