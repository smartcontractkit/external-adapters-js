import { Transport, TransportDependencies } from '@chainlink/external-adapter-framework/transports'
import { ResponseCache } from '@chainlink/external-adapter-framework/cache/response'
import {
  AdapterRequest,
  AdapterResponse,
  SingleNumberResultResponse,
  sleep,
} from '@chainlink/external-adapter-framework/util'
import { Cache } from '@chainlink/external-adapter-framework/cache'
import { AdapterEndpoint } from '@chainlink/external-adapter-framework/adapter'
import { customSettings } from '../config'
import { AdapterConfig } from '@chainlink/external-adapter-framework/config'
import axios, { AxiosRequestConfig, AxiosResponse } from 'axios'
import { BigNumber, ethers } from 'ethers'

export enum Frequency {
  ONE_DAY = '1d',
  ONE_BLOCK = '1b',
}

type EndpointTypes = {
  Response: SingleNumberResultResponse
  Request: {
    Params: RequestParams
  }
  CustomSettings: typeof customSettings
  Provider: {
    RequestBody: never
    ResponseBody: void
  }
}

interface RequestParams {
  asset: string
  frequency: string
  pageSize: number
  startTime?: string
  endTime?: string
}

const inputParams = {
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
    default: Frequency.ONE_DAY,
  },
  pageSize: {
    description: 'Number of results to get per page. From 1 to 10000',
    default: 10_000,
    type: 'number',
    required: false,
  },
  startTime: {
    description:
      'The start time for the queried period. See [Supported DateTime Formats](#supported-datetime-formats)',
    type: 'string',
    required: false,
  },
  endTime: {
    description:
      'The end time for the queried period. See [Supported DateTime Formats](#supported-datetime-formats)',
    type: 'string',
    required: false,
  },
} as const

interface AssetMetrics {
  asset: string
  time: string
  FeeTotNtv: string
  IssTotNtv: string
  RevNtv: string
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
      throw new Error(
        `Unprocessable asset metrics: ${JSON.stringify(assetMetrics)}, due to: ${error}.`,
      )
    }
    burnedTKN = burnedTKN.add(feeTotNTV.sub(revNtv.sub(issTotNtv)))
  })
  return burnedTKN
}

export class TotalBurnedTransport implements Transport<EndpointTypes> {
  cache!: Cache<AdapterResponse<EndpointTypes['Response']>>
  responseCache!: ResponseCache<any>

  async initialize(dependencies: TransportDependencies<EndpointTypes>): Promise<void> {
    this.cache = dependencies.cache as Cache<AdapterResponse<EndpointTypes['Response']>>
    this.responseCache = dependencies.responseCache
  }

  async foregroundExecute(
    req: AdapterRequest<EndpointTypes['Request']>,
    config: AdapterConfig<typeof customSettings>,
  ): Promise<AdapterResponse<EndpointTypes['Response']>> {
    let totalBurnedTKN = BigNumber.from('0')

    let lastPage = false
    const requestConfig = this.prepareRequest(req.requestContext.data, config)

    while (!lastPage) {
      const responseData = await this.makeRequest(requestConfig, config)

      const { data: assetMetricsList } = responseData.data

      totalBurnedTKN = totalBurnedTKN.add(calculateBurnedTKN(assetMetricsList))

      const nextPageToken = responseData.data.next_page_token
      if (!nextPageToken || assetMetricsList.length < req.requestContext.data.pageSize) {
        lastPage = true
      }
      requestConfig.params.next_page_token = nextPageToken
    }

    const providerDataReceivedUnixMs = Date.now()

    const result = ethers.utils.formatEther(totalBurnedTKN.toString())

    const response = {
      data: {
        result: parseFloat(result),
      },
      statusCode: 200,
      result: parseFloat(result),
      timestamps: {
        providerDataReceivedUnixMs,
        // providerIndicatedTimeUnixMs: 0,
        // providerDataStreamEstablishedUnixMs: 0,
      },
    }

    await this.cache.set(req.requestContext.cacheKey, response, config.CACHE_MAX_AGE)

    return response
  }

  prepareRequest(params: RequestParams, config: AdapterConfig<typeof customSettings>): any {
    const { API_ENDPOINT, API_KEY } = config
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

  async makeRequest(
    axiosRequest: AxiosRequestConfig<any>,
    config: AdapterConfig<typeof customSettings>,
  ): Promise<AxiosResponse<any>> {
    let retryNumber = 0
    let response = await axios.request(axiosRequest)
    while (response.status !== 200) {
      retryNumber++
      // logger.warn(
      //   'Encountered error when fetching data from coinmetrics:',
      //   response.status,
      //   response.statusText,
      // )

      if (retryNumber === config.RETRY) {
        throw '2222'
      }

      // logger.debug(
      //   `Sleeping for 400ms before retrying`,
      // )
      await sleep(400)
      response = await axios.request(axiosRequest)
    }
    return response
  }
}

export const endpoint = new AdapterEndpoint<EndpointTypes>({
  name: 'burned',
  transport: new TotalBurnedTransport(),
  inputParameters: inputParams,
})
