import { AdapterEndpoint } from '@chainlink/external-adapter-framework/adapter'
import { calculateHttpRequestKey } from '@chainlink/external-adapter-framework/cache'
import { ResponseCache } from '@chainlink/external-adapter-framework/cache/response'
import { Transport, TransportDependencies } from '@chainlink/external-adapter-framework/transports'
import {
  AdapterRequest,
  AdapterResponse,
  SingleNumberResultResponse,
  makeLogger,
} from '@chainlink/external-adapter-framework/util'
import { Requester } from '@chainlink/external-adapter-framework/util/requester'
import { InputParameters } from '@chainlink/external-adapter-framework/validation'
import { AdapterError } from '@chainlink/external-adapter-framework/validation/error'
import {
  InputParametersDefinition,
  TypeFromDefinition,
} from '@chainlink/external-adapter-framework/validation/input-params'
import { BigNumber, ethers } from 'ethers'
import { config } from '../config'

const logger = makeLogger('CoinMetricsBurnedTransport')

export enum Frequency {
  ONE_DAY = '1d',
  ONE_BLOCK = '1b',
}

const ENPDOINT_NAME = 'total-burned'

export const FrequencyInputOptions = [Frequency.ONE_DAY, Frequency.ONE_BLOCK]

interface AssetMetrics {
  asset: string
  time: string
  FeeTotNtv: string
  IssTotNtv: string
  RevNtv: string
}

export interface BurnedResponseSchema {
  data: AssetMetrics[]
  next_page_token?: string
  next_page_url?: string
}

interface RequestParams {
  asset: string
  frequency: string
  pageSize?: number
  startTime?: string
  endTime?: string
}

type ProviderRequestConfig = {
  baseURL: string
  url: 'timeseries/asset-metrics'
  params: {
    assets: string
    metrics: 'FeeTotNtv,RevNtv,IssTotNtv'
    frequency: string
    page_size?: number
    api_key: string
    start_time?: string
    end_time?: string
    next_page_token?: string
  }
}

export const baseInputParametersDefinition = {
  asset: {
    description:
      'The symbol of the currency to query. See [Coin Metrics Assets](https://docs.coinmetrics.io/info/assets)',
    type: 'string',
    required: true,
  },
  frequency: {
    description: 'At which interval to calculate the number of coins/tokens burned',
    type: 'string',
    required: false,
    options: FrequencyInputOptions,
    default: Frequency.ONE_DAY,
  },
  pageSize: {
    description: 'Number of results to get per page. From 1 to 10000',
    default: 10_000,
    type: 'number',
    required: false,
  },
} as const satisfies InputParametersDefinition

const inputParameters = new InputParameters(baseInputParametersDefinition)

export type EndpointTypes = {
  Parameters: typeof inputParameters.definition
  Settings: typeof config.settings
  Response: SingleNumberResultResponse
  Provider: {
    RequestBody: never
    ResponseBody: BurnedResponseSchema
  }
}

export const calculateBurnedTKN = (assetMetricsList: AssetMetrics[]): BigNumber => {
  let burnedTKN = BigNumber.from('0')
  assetMetricsList.forEach((assetMetrics: AssetMetrics) => {
    let feeTotNTV
    let revNtv
    let issTotNtv
    try {
      feeTotNTV = ethers.utils.parseEther(assetMetrics.FeeTotNtv)
      revNtv = ethers.utils.parseEther(assetMetrics.RevNtv)
      issTotNtv = ethers.utils.parseEther(assetMetrics.IssTotNtv)
    } catch (error) {
      throw new AdapterError({
        message: `Unprocessable asset metrics: ${JSON.stringify(assetMetrics)}, due to: ${error}.`,
      })
    }
    burnedTKN = burnedTKN.add(feeTotNTV.sub(revNtv.sub(issTotNtv)))
  })
  return burnedTKN
}

export class TotalBurnedTransport<T extends EndpointTypes> implements Transport<T> {
  name!: string
  requester!: Requester
  responseCache!: ResponseCache<T>

  async initialize(
    dependencies: TransportDependencies<T>,
    _adapterSettings: EndpointTypes['Settings'],
    _endpointName: string,
    transportName: string,
  ): Promise<void> {
    this.responseCache = dependencies.responseCache
    this.requester = dependencies.requester
    this.name = transportName
  }

  async foregroundExecute(
    req: AdapterRequest<TypeFromDefinition<T['Parameters']>>,
    settings: typeof config.settings,
  ): Promise<AdapterResponse<EndpointTypes['Response']>> {
    let totalBurnedTKN = BigNumber.from('0')

    let lastPage = false
    const input = req.requestContext.data as typeof inputParameters.validated
    const isBurnedEndpoint = req.requestContext.endpointName === 'burned'
    if (isBurnedEndpoint) {
      input.pageSize = 1
    }
    const requestConfig = this.prepareRequest(input, settings)

    const providerDataRequestedUnixMs = Date.now()
    while (!lastPage) {
      const result = await this.requester.request<BurnedResponseSchema>(
        calculateHttpRequestKey<EndpointTypes>({
          context: {
            adapterSettings: settings,
            inputParameters,
            endpointName: req.requestContext.endpointName,
          },
          data: requestConfig.params,
          transportName: this.name,
        }),
        requestConfig,
      )

      const { data: assetMetricsList } = result.response.data

      totalBurnedTKN = totalBurnedTKN.add(calculateBurnedTKN(assetMetricsList))

      const nextPageToken = result.response.data.next_page_token
      requestConfig.params.next_page_token = nextPageToken

      if (
        !nextPageToken ||
        (input.pageSize && assetMetricsList.length < input.pageSize) ||
        isBurnedEndpoint
      ) {
        lastPage = true
      }
    }

    const providerDataReceivedUnixMs = Date.now()

    const result = ethers.utils.formatEther(totalBurnedTKN.toString())

    logger.debug(
      'Successfully fetched all pages, returning total number across all tokens: ',
      result,
    )

    const response = {
      data: {
        result: parseFloat(result),
      },
      statusCode: 200,
      result: parseFloat(result),
      timestamps: {
        providerDataRequestedUnixMs,
        providerDataReceivedUnixMs,
        providerIndicatedTimeUnixMs: undefined,
      },
    }
    await this.responseCache.write(this.name, [
      {
        params: req.requestContext.data,
        response,
      },
    ])

    return response
  }

  prepareRequest(params: RequestParams, settings: typeof config.settings): ProviderRequestConfig {
    const { API_ENDPOINT, API_KEY } = settings
    return {
      baseURL: API_ENDPOINT,
      url: 'timeseries/asset-metrics',
      params: {
        assets: params.asset.toLowerCase(),
        metrics: 'FeeTotNtv,RevNtv,IssTotNtv',
        frequency: params.frequency,
        page_size: params.pageSize,
        api_key: API_KEY,
        start_time: params.startTime,
        end_time: params.endTime,
      },
    }
  }
}

export const endpoint = new AdapterEndpoint<EndpointTypes>({
  name: ENPDOINT_NAME,
  transport: new TotalBurnedTransport(),
  inputParameters,
})
