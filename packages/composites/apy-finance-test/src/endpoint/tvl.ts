import { AdapterEndpoint } from '@chainlink/external-adapter-framework/adapter'
import { AdapterRequest, AdapterResponse } from '@chainlink/external-adapter-framework/util'
import { InputParameters } from '@chainlink/external-adapter-framework/validation'
import { config } from '../config'
import { CompositeHttpTransport } from '../transports/composite-http'
import { AllocationsResponse, endpoint as allocationsEndpoint } from './allocations'
import {
  AdapterDataProviderError,
  AdapterInputError,
} from '@chainlink/external-adapter-framework/validation/error'
import {
  getTotalAllocations,
  TAResponse,
  TASourceEnvName,
} from '@chainlink/token-allocation-test-adapter'

const inputParameters = new InputParameters({
  source: {
    description: 'The data provider to query data from',
    required: true,
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
  Data: TAResponse
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

    const { EA_PORT, BASE_URL } = settings

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

    // Fetch calculated allocation values from the Token Allocation Utility Adapter
    // We cast the types since endpoints' customInputValidation already checks for env var with source prefix
    const sourceEnvName = `${params.source?.toUpperCase()}_ADAPTER_URL` as TASourceEnvName
    const sourceUrl = settings[sourceEnvName] as string

    const data = await getTotalAllocations({
      allocations,
      sourceUrl,
      quote: params.quote,
    })

    if (!data || data.result == undefined) {
      throw new AdapterDataProviderError(
        {
          statusCode: 502,
          url: apyFinanceAdapterUrl,
          cause: 'No data and/or result received from Token Allocations adapter',
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
        data,
        result: data.result,
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
  customInputValidation: (
    req: AdapterRequest<typeof inputParameters.validated>,
    settings: typeof config.settings,
  ): AdapterInputError | undefined => {
    const { source } = req.requestContext.data
    const sourceEnvName = `${source?.toUpperCase()}_ADAPTER_URL` as TASourceEnvName
    const sourceEAUrl = settings[sourceEnvName]
    if (!sourceEAUrl) {
      throw new AdapterInputError({
        statusCode: 400,
        message: `Missing ${sourceEnvName} env variable.`,
      })
    }
    return
  },
})
