import { AdapterConfig, SettingsMap } from '@chainlink/external-adapter-framework/config'
import { RestTransport } from '@chainlink/external-adapter-framework/transports'
import {
  AdapterRequest,
  AdapterResponse,
  makeLogger,
  sleep,
} from '@chainlink/external-adapter-framework/util'
import { axiosRequest } from '@chainlink/external-adapter-framework/transports/util'
import * as rateLimitMetrics from '@chainlink/external-adapter-framework/rate-limiting/metrics'
import { ethers, BigNumber } from 'ethers'
import { AdapterDataProviderError } from '@chainlink/external-adapter-framework/validation/error'

const logger = makeLogger('Coinmetrics TotalBurnedTransport')

export interface TotalBurnedInputParams {
  asset: string
  frequency: string
  pageSize: number
  startTime: string
  endTime: string
}

export interface AssetMetrics {
  asset: string
  time: string
  FeeTotNtv: string
  IssTotNtv: string
  RevNtv: string
}

export interface ResponseSchema {
  data: AssetMetrics[]
  next_page_token?: string
  next_page_url?: string
  totalBurnedTKN: BigNumber
}

// Common frequencies for FeeTotNtv, RevNtv and IssTotNtv metrics
export enum Frequency {
  ONE_DAY = '1d',
  ONE_BLOCK = '1b',
}

export const METRICS = 'FeeTotNtv,RevNtv,IssTotNtv'
export const DEFAULT_PAGE_SIZE = 10_000
export const URL = 'timeseries/asset-metrics'

export type TotalBurnedEndpointTypes = {
  Request: {
    Params: TotalBurnedInputParams
  }
  Response: {
    Data: ResponseSchema | undefined
    Result: string
  }
  CustomSettings: SettingsMap
  Provider: {
    RequestBody: never
    ResponseBody: ResponseSchema
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
      throw new Error(
        `Unprocessable asset metrics: ${JSON.stringify(assetMetrics)}, due to: ${error}.`,
      )
    }
    burnedTKN = burnedTKN.add(feeTotNTV.sub(revNtv.sub(issTotNtv)))
  })
  return burnedTKN
}

export class TotalBurnedTransport extends RestTransport<TotalBurnedEndpointTypes> {
  async foregroundExecute(
    req: AdapterRequest<TotalBurnedEndpointTypes['Request']>,
    config: AdapterConfig<TotalBurnedEndpointTypes['CustomSettings']>,
  ): Promise<AdapterResponse<TotalBurnedEndpointTypes['Response']> | undefined> {
    // Add some entropy here because of possible scenario where the key won't be set before multiple
    // other instances in a burst request try to access the coalescing key.
    const randomMs = Math.random() * (this.config.options.requestCoalescing.entropyMax || 0)
    await sleep(randomMs)

    // Check if request is in flight if coalescing is enabled
    const inFlight =
      this.config.options.requestCoalescing.enabled &&
      (await this.cache.get(this.inFlightPrefix + req.requestContext.cacheKey))
    if (inFlight) {
      logger.debug('Request is in flight, transport has been set up')
      return
    } else if (this.config.options.requestCoalescing.enabled) {
      // If it wasn't in flight and coalescing is disabled, register it as in flight
      const ttl =
        config.REST_TRANSPORT_MAX_RATE_LIMIT_RETRIES *
        config.REST_TRANSPORT_MS_BETWEEN_RATE_LIMIT_RETRIES
      logger.debug('Setting up rest transport, setting request in flight in cache')
      await this.inFlightCache.set(
        this.inFlightPrefix + req.requestContext.cacheKey,
        true,
        ttl + 100,
      ) // Can't use Infinity for things like Redis
    }

    const request = await this.config.prepareRequest(req, config)

    logger.trace('Check if we are under rate limits to perform request')
    await this.waitUntilUnderRateLimit({
      maxRetries: config.REST_TRANSPORT_MAX_RATE_LIMIT_RETRIES,
      msBetweenRetries: config.REST_TRANSPORT_MS_BETWEEN_RATE_LIMIT_RETRIES,
    })

    let providerResponse
    let totalBurnedTKN = BigNumber.from('0')
    /*eslint no-constant-condition: ["error", { "checkLoops": false }]*/
    while (true) {
      logger.trace('Sending request to data provider...')
      providerResponse = await axiosRequest<
        TotalBurnedEndpointTypes['Provider']['RequestBody'],
        TotalBurnedEndpointTypes['Provider']['ResponseBody'],
        TotalBurnedEndpointTypes['CustomSettings']
      >(request, config)

      const assetMetricsList = providerResponse.data?.data
      if (!Array.isArray(assetMetricsList)) {
        throw new AdapterDataProviderError({
          statusCode: 500,
          message: `Unexpected response: ${JSON.stringify(
            assetMetricsList,
          )}. 'data' expected to be an array.`,
        })
      }
      totalBurnedTKN = totalBurnedTKN.add(calculateBurnedTKN(assetMetricsList))

      const nextPageToken = providerResponse.data?.next_page_token
      if (
        !nextPageToken ||
        assetMetricsList.length < request.params.pageSize ||
        request.params.isBurnedEndpointMode
      )
        break
      request.params.next_page_token = nextPageToken
    }

    // Add totalBurnedTKN to response data
    providerResponse.data.totalBurnedTKN = totalBurnedTKN

    logger.debug(`Got response from provider, parsing (raw body: ${providerResponse.data})`)
    const parsedResponse = await this.config.parseResponse(req, providerResponse, config)

    if (config.API_VERBOSE) {
      parsedResponse.data = providerResponse.data
    }

    if (config.METRICS_ENABLED && config.EXPERIMENTAL_METRICS_ENABLED) {
      parsedResponse.maxAge = Date.now() + config.CACHE_MAX_AGE
      parsedResponse.meta = {
        metrics: { feedId: req.requestContext.meta?.metrics?.feedId || 'N/A' },
      }
    }

    logger.debug('Setting provider response in cache')
    await this.cache.set(req.requestContext.cacheKey, parsedResponse, config.CACHE_MAX_AGE)

    // Record cost of data provider call
    const cost = rateLimitMetrics.retrieveCost(providerResponse.data)
    rateLimitMetrics.rateLimitCreditsSpentTotal
      .labels({
        feed_id: req.requestContext.meta?.metrics?.feedId || 'N/A',
        participant_id: req.requestContext.cacheKey,
      })
      .inc(cost)

    // Update cacheHit flag in request meta for metrics use
    req.requestContext.meta = {
      ...req.requestContext.meta,
      metrics: { ...req.requestContext.meta?.metrics, cacheHit: false },
    }

    if (this.config.options.requestCoalescing.enabled) {
      logger.debug('Set provider response in cache, removing in flight from cache')
      await this.cache.delete(this.inFlightPrefix)
    }

    return parsedResponse
  }
}
