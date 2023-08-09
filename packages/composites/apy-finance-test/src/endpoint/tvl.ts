import { AdapterEndpoint } from '@chainlink/external-adapter-framework/adapter'
import { AdapterResponse } from '@chainlink/external-adapter-framework/util'
import { InputParameters } from '@chainlink/external-adapter-framework/validation'
import { types } from '@chainlink/token-allocation-adapter'
import { config } from '../config'
import { CompositeHttpTransport } from '../transports/composite-http'
import { AllocationsResponse, endpoint as allocationsEndpoint } from './allocations'
import { AdapterDataProviderError } from '@chainlink/external-adapter-framework/validation/error'

const inputParameters = new InputParameters({
  source: {
    description: 'The data provider to query data from',
    required: false,
    type: 'string',
  },
  quote: {
    aliases: ['to', 'market'],
    description: 'The symbol of the currency to convert to',
    required: false,
    type: 'string',
  },
})

type TokenAllocationsResponse = {
  Data: {
    sources: void[]
    payload: types.ResponsePayload
    result: number
  }
  Result: number
}

type EndpointTypes = {
  Parameters: typeof inputParameters.definition
  Response: TokenAllocationsResponse
  Settings: typeof config.settings
}

const compositeTransport = new CompositeHttpTransport<EndpointTypes>({
  performRequest: async (params, settings, requestHandler) => {
    const providerDataRequested = Date.now()

    const { EA_PORT, BASE_URL, TOKEN_ALLOCATION_ADAPTER_URL } = settings

    // Fetch allocations from the /allocations endpoint on this Adapter
    const apyFinanceAdapterUrl = `http://localhost:${EA_PORT}${BASE_URL}`
    const allocations = await requestHandler<AdapterResponse<AllocationsResponse>>({
      url: apyFinanceAdapterUrl,
      method: 'POST',
      data: {
        data: {
          endpoint: allocationsEndpoint.name,
        },
      },
    }).then((res) => res.data.data)

    if (!allocations || allocations.length < 1) {
      throw new AdapterDataProviderError(
        {
          statusCode: 502,
          url: apyFinanceAdapterUrl,
          cause: 'No allocations received from apy-finance allocations endpoint',
        },
        {
          providerDataRequestedUnixMs: providerDataRequested,
          providerDataReceivedUnixMs: Date.now(),
          providerIndicatedTimeUnixMs: undefined,
        },
      )
    }

    // Fetch calculated allocation values from the Token Allocation Adapter
    const { data, result } = await requestHandler<AdapterResponse<TokenAllocationsResponse>>({
      url: TOKEN_ALLOCATION_ADAPTER_URL,
      method: 'POST',
      data: {
        data: {
          ...params,
          allocations,
        },
      },
    }).then((res) => res.data)

    if (!data || result == undefined) {
      throw new AdapterDataProviderError(
        {
          statusCode: 502,
          url: apyFinanceAdapterUrl,
          cause: 'No data and/or result recived from Token Allocations adapter',
        },
        {
          providerDataRequestedUnixMs: providerDataRequested,
          providerDataReceivedUnixMs: Date.now(),
          providerIndicatedTimeUnixMs: undefined,
        },
      )
    }

    return {
      params: params,
      response: {
        data: data,
        result: result,
        timestamps: {
          providerDataRequestedUnixMs: providerDataRequested,
          providerDataReceivedUnixMs: Date.now(),
          providerIndicatedTimeUnixMs: undefined,
        },
      },
    }
  },
})

export const endpoint = new AdapterEndpoint<EndpointTypes>({
  name: 'tvl',
  transport: compositeTransport,
  inputParameters: inputParameters,
})
