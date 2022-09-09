import { AxiosRequestConfig, AxiosResponse } from 'axios'
import { InputParameters } from '@chainlink/external-adapter-framework/validation'
import { baseInputParameters } from '@chainlink/external-adapter-framework/validation/input-params'
import { BatchWarmingTransport } from '@chainlink/external-adapter-framework/transports'
import { ProviderResult } from '@chainlink/external-adapter-framework/util'
import { AdapterContext, AdapterEndpoint } from '@chainlink/external-adapter-framework/adapter'

import {
  ProviderRequestBody,
  buildBatchedRequestBody,
  constructEntry,
  ProviderResponseBody,
  CryptoRequestParams,
} from '../cryptoUtils'
import { AdapterRequestParams } from '../globalUtils'
import { customSettings } from '../config'

export const inputParameters: InputParameters = {
  overrides: baseInputParameters['overrides'],
  coinid: {
    description: 'The CoinGecko id or to query',
    required: false,
  },
  base: {
    aliases: ['from', 'coin'],
    description: 'The symbol of symbols of the currency to query',
    required: false,
  },
  quote: {
    aliases: ['to', 'market'],
    description: 'The symbol of the currency to convert to',
    required: true,
  },
}

const batchEndpointTransport = new BatchWarmingTransport({
  prepareRequest: (
    params: CryptoRequestParams[],
    context: AdapterContext,
  ): AxiosRequestConfig<ProviderRequestBody> => {
    const requestBody = buildBatchedRequestBody(params, context.adapterConfig)
    requestBody.params.include_24hr_vol = true
    return requestBody
  },
  parseResponse: (
    params: CryptoRequestParams[],
    res: AxiosResponse<ProviderResponseBody>,
  ): ProviderResult<AdapterRequestParams>[] => {
    const entries = [] as ProviderResult<CryptoRequestParams>[]
    for (const requestPayload of params) {
      const entry = constructEntry(
        res,
        requestPayload,
        `${requestPayload.quote?.toLowerCase()}_24h_vol`,
      )
      if (entry) {
        entries.push({
          ...entry,
          params: {
            ...entry.params,
            market: 'coingecko',
          },
        })
      }
    }
    return entries
  },
})

export const endpoint: AdapterEndpoint<
  CryptoRequestParams,
  ProviderResult<AdapterRequestParams>[],
  typeof customSettings
> = {
  name: 'volume',
  aliases: ['crypto-volume'],
  transport: batchEndpointTransport,
  inputParameters,
}
