import { AdapterEndpoint } from '@chainlink/external-adapter-framework/adapter'
import { HttpTransport } from '@chainlink/external-adapter-framework/transports'
import { SingleNumberResultResponse } from '@chainlink/external-adapter-framework/util'
import { InputParameters } from '@chainlink/external-adapter-framework/validation'
import { config } from '../config'

export const inputParameters = new InputParameters({})
export type EndpointTypes = {
  Parameters: typeof inputParameters.definition
  Settings: typeof config.settings
  Response: SingleNumberResultResponse
}

type AssetReserves = {
  amount: number
  fiat_amount: number
  address: string
}

type ProviderResponseBody = {
  status: string
  data: {
    total_value_in_usd: number
    timestamp: number
  } & Record<string, AssetReserves[]>
}

// Utility function for identifying the Asset reserves data out of the other data returned in the provider response.
const isAssetReservesList = (values: unknown): values is AssetReserves[] => {
  return (
    Array.isArray(values) &&
    values.every(
      (value) =>
        value != null &&
        typeof value === 'object' &&
        'amount' in value &&
        'fiat_amount' in value &&
        'address' in value &&
        typeof value.amount === 'number' &&
        typeof value.fiat_amount === 'number' &&
        typeof value.address === 'string',
    )
  )
}

const parseAssetReserves = (res: ProviderResponseBody['data']): Record<string, AssetReserves[]> => {
  const assetReserves: Record<string, AssetReserves[]> = {}

  Object.keys(res).forEach((key) => {
    const value = res[key] as unknown
    if (isAssetReservesList(value)) {
      assetReserves[key] = value
    }
  })

  return assetReserves
}

type HttpTransportTypes = EndpointTypes & {
  Provider: {
    RequestBody: undefined
    ResponseBody: ProviderResponseBody
  }
}

const httpTransport = new HttpTransport<HttpTransportTypes>({
  prepareRequests: (params, config) => {
    return {
      params,
      request: {
        url: `${config.API_ENDPOINT}/hope-money`,
        headers: {
          'X-POR-ACCESS-KEY': config.API_KEY,
          'X-POR-ACCESS-SECRET': config.API_SECRET,
        },
      },
    }
  },
  parseResponse: (params, res) => {
    return params.map((param) => {
      if (res.data.status.toLowerCase() != 'success') {
        return {
          params: param,
          response: {
            statusCode: 502,
            errorMessage: `Invalid status returned from provider: '${res.data.status}'.`,
          },
        }
      }

      const data = res.data?.data
      if (!data || !data.total_value_in_usd) {
        return {
          params: param,
          response: {
            statusCode: 502,
            errorMessage: `Invalid data returned from provider - does not contain total reserves value.`,
          },
        }
      }

      const assetReserves = parseAssetReserves(data)
      const aggregate_fiat_value = Object.values(assetReserves)
        .map((reserves) => reserves.map((reserve) => reserve.fiat_amount))
        .flat()
        .reduce((sum, current) => sum + current, 0)

      if (Math.round(aggregate_fiat_value) != Math.round(data.total_value_in_usd)) {
        return {
          params: param,
          response: {
            statusCode: 502,
            errorMessage: `Invalid total_value_in_usd returned from provider - does not match aggregated reserves value.`,
          },
        }
      }

      return {
        params: param,
        response: {
          data: {
            result: data.total_value_in_usd,
          },
          result: data.total_value_in_usd,
          timestamps: {
            providerIndicatedTimeUnixMs: new Date(data.timestamp * 1000).getTime(),
          },
        },
      }
    })
  },
})

export const endpoint = new AdapterEndpoint({
  name: 'hope',
  transport: httpTransport,
  inputParameters,
})
