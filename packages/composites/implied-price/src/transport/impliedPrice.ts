import { EndpointContext } from '@chainlink/external-adapter-framework/adapter'
import { ResponseCache } from '@chainlink/external-adapter-framework/cache/response'
import { TransportDependencies } from '@chainlink/external-adapter-framework/transports'
import { SubscriptionTransport } from '@chainlink/external-adapter-framework/transports/abstract/subscription'
import { AdapterResponse, makeLogger, sleep } from '@chainlink/external-adapter-framework/util'
import { Requester } from '@chainlink/external-adapter-framework/util/requester'
import { BaseEndpointTypes, inputParameters } from '../endpoint/impliedPrice'
import {
  PriceInput,
  calculateMedian,
  createRequestKey,
  normalizeInput,
  parseInput,
  parseSources,
} from '../utils'

const logger = makeLogger('ComputedPriceTransport')

type RequestParams = typeof inputParameters.validated

interface SourceResponse {
  result: number
  source: string
  statusCode: number
}

interface CircuitBreakerState {
  failures: number
  lastFailureTime: number
  isOpen: boolean
}

const circuitBreakerState = new Map<string, CircuitBreakerState>()
const pendingRequests = new Map<
  string,
  { promise: Promise<SourceResponse | null>; timestamp: number }
>()

export class ComputedPriceTransport extends SubscriptionTransport<BaseEndpointTypes> {
  name!: string
  responseCache!: ResponseCache<BaseEndpointTypes>
  requester!: Requester
  settings!: BaseEndpointTypes['Settings']

  async initialize(
    dependencies: TransportDependencies<BaseEndpointTypes>,
    adapterSettings: BaseEndpointTypes['Settings'],
    endpointName: string,
    transportName: string,
  ): Promise<void> {
    await super.initialize(dependencies, adapterSettings, endpointName, transportName)
    this.responseCache = dependencies.responseCache
    this.requester = dependencies.requester
    this.settings = adapterSettings
    this.name = transportName
  }

  getSubscriptionTtlFromConfig(adapterSettings: BaseEndpointTypes['Settings']): number {
    return adapterSettings.CACHE_MAX_AGE
  }

  async backgroundHandler(context: EndpointContext<BaseEndpointTypes>, entries: RequestParams[]) {
    await Promise.all(entries.map(async (entry) => this.handleSingleRequest(entry)))
    await sleep(context.adapterSettings.BACKGROUND_EXECUTE_MS)
  }

  async handleSingleRequest(params: RequestParams): Promise<void> {
    try {
      const dividendSources = parseSources(params.dividendSources as string | string[])
      const divisorSources = parseSources(params.divisorSources as string | string[])

      const parsedDividendInput = parseInput(params.dividendInput, 'dividendInput')
      const parsedDivisorInput = parseInput(params.divisorInput, 'divisorInput')

      const normalizedDividendInput = normalizeInput(parsedDividendInput)
      const normalizedDivisorInput = normalizeInput(parsedDivisorInput)

      const dividendMinAnswers = (params.dividendMinAnswers as number) || 1
      const divisorMinAnswers = (params.divisorMinAnswers as number) || 1
      const operation = (params.operation as string).toLowerCase()

      logger.debug(
        `Processing computed price calculation: ${JSON.stringify({
          dividendSources,
          divisorSources,
          normalizedDividendInput,
          normalizedDivisorInput,
          dividendMinAnswers,
          divisorMinAnswers,
          operation,
        })}`,
      )

      // Fetch data from actual source adapters
      const [dividendResults, divisorResults] = await Promise.all([
        this.fetchFromMultipleSources(dividendSources, normalizedDividendInput, dividendMinAnswers),
        this.fetchFromMultipleSources(divisorSources, normalizedDivisorInput, divisorMinAnswers),
      ])

      // Calculate medians using the real median logic
      const dividendMedian = calculateMedian(dividendResults.map((r) => r.result))
      const divisorMedian = calculateMedian(divisorResults.map((r) => r.result))

      if (dividendMedian.isZero()) {
        throw new Error('Dividend result is zero')
      }

      if (divisorMedian.isZero()) {
        throw new Error('Divisor result is zero')
      }

      let result: typeof dividendMedian
      if (operation === 'divide') {
        result = dividendMedian.div(divisorMedian)
      } else if (operation === 'multiply') {
        result = dividendMedian.mul(divisorMedian)
      } else {
        throw new Error(
          `Unsupported operation: ${operation}. This should not be possible because of input validation.`,
        )
      }

      const computedPrice = Number(result.toFixed())

      logger.info(
        `Computed price calculated successfully: ${JSON.stringify({
          dividendResponses: dividendResults.length,
          divisorResponses: divisorResults.length,
          operation,
          result: computedPrice,
        })}`,
      )

      const response: AdapterResponse<BaseEndpointTypes['Response']> = {
        result: computedPrice,
        statusCode: 200,
        data: {
          result: computedPrice,
        },
        timestamps: {
          providerIndicatedTimeUnixMs: Date.now(),
          providerDataReceivedUnixMs: Date.now(),
          providerDataStreamEstablishedUnixMs: Date.now(),
        },
      }

      await this.responseCache.write(this.name, [{ params, response }])
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
      logger.error(`Failed to calculate computed price: ${JSON.stringify({ error: errorMessage })}`)

      let statusCode = 500
      if (errorMessage.includes('zero')) {
        statusCode = 422
      } else if (errorMessage.includes('Invalid JSON') || errorMessage.includes('required')) {
        statusCode = 400
      } else if (errorMessage.includes('Insufficient responses')) {
        statusCode = 502
      } else if (errorMessage.includes('No URL configured')) {
        statusCode = 503
      } else if (errorMessage.includes('timeout')) {
        statusCode = 504
      } else if (errorMessage.includes('Unsupported operation')) {
        statusCode = 400
      }

      const errorResponse: AdapterResponse<BaseEndpointTypes['Response']> = {
        statusCode,
        errorMessage,
        timestamps: {
          providerIndicatedTimeUnixMs: Date.now(),
          providerDataReceivedUnixMs: Date.now(),
          providerDataStreamEstablishedUnixMs: Date.now(),
        },
      }

      await this.responseCache.write(this.name, [{ params, response: errorResponse }])
    }
  }

  private async fetchFromMultipleSources(
    sources: string[],
    input: PriceInput,
    minAnswers: number,
  ): Promise<SourceResponse[]> {
    const sourcePromises = sources.map(async (source) => {
      const requestKey = createRequestKey(source, input)

      // Check for existing pending request (request coalescing)
      const existingRequest = pendingRequests.get(requestKey)
      const coalescingInterval = this.settings.REQUEST_COALESCING_INTERVAL || 100

      if (existingRequest && Date.now() - existingRequest.timestamp < coalescingInterval) {
        logger.debug(`Using coalesced request for ${source}`)
        return existingRequest.promise
      } else {
        const promise = this.fetchFromSourceAdapter(source, input).catch((error) => {
          logger.error(
            `Source ${source} failed: ${JSON.stringify({
              error: error instanceof Error ? error.message : 'Unknown error',
            })}`,
          )
          return null
        })

        pendingRequests.set(requestKey, { promise, timestamp: Date.now() })
        // Clean up after coalescing interval
        setTimeout(() => pendingRequests.delete(requestKey), coalescingInterval)
        return promise
      }
    })

    const results = await Promise.all(sourcePromises)
    const successfulResults = results.filter((result): result is SourceResponse => result !== null)

    if (successfulResults.length < minAnswers) {
      throw new Error(
        `Insufficient responses: got ${successfulResults.length}, required ${minAnswers}`,
      )
    }

    return successfulResults
  }

  private async fetchFromSourceAdapter(source: string, input: PriceInput): Promise<SourceResponse> {
    if (this.isCircuitBreakerOpen(source)) {
      throw new Error(`Circuit breaker is open for source: ${source}`)
    }

    const sourceUrl = this.getSourceAdapterUrl(source)
    const maxRetries = this.settings.MAX_RETRIES || 3
    const retryDelay = this.settings.RETRY_DELAY || 1000
    const timeout = this.settings.SOURCE_TIMEOUT || 10000

    let lastError: Error | null = null

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        if (attempt > 0) {
          const delay = retryDelay * Math.pow(2, attempt - 1)
          await sleep(delay)
          logger.debug(`Retrying request to ${source}, attempt ${attempt}/${maxRetries}`)
        }

        const requestConfig = {
          method: 'POST' as const,
          baseURL: sourceUrl,
          url: '/',
          data: { data: input },
          timeout,
          headers: { 'Content-Type': 'application/json' },
        }

        const requesterResult = await this.requester.request(
          JSON.stringify(requestConfig),
          requestConfig,
        )

        const response = requesterResult.response
        const statusCode = response.status || 200
        const responseData = response.data as any

        if (statusCode === 200 && responseData?.result !== undefined) {
          this.updateCircuitBreakerState(source, true)
          return {
            result: responseData.result,
            source,
            statusCode,
          }
        } else {
          throw new Error(`Invalid response from ${source}: status ${statusCode}, no result data`)
        }
      } catch (error) {
        lastError = error as Error

        const errorMessage = error instanceof Error ? error.message : 'Unknown error'
        if (errorMessage.includes('timeout') || errorMessage.includes('ECONNABORTED')) {
          logger.warn(`Timeout requesting from ${source}: ${JSON.stringify({ timeout, attempt })}`)
        } else if (errorMessage.includes('status')) {
          logger.warn(
            `HTTP error from ${source}: ${JSON.stringify({ error: errorMessage, attempt })}`,
          )
        } else {
          logger.warn(
            `Network error requesting from ${source}: ${JSON.stringify({
              message: errorMessage,
              attempt,
            })}`,
          )
        }
      }
    }

    this.updateCircuitBreakerState(source, false)
    throw lastError || new Error(`Failed to fetch from ${source} after ${maxRetries} retries`)
  }

  private getSourceAdapterUrl(source: string): string {
    const envKey = `${source.toUpperCase()}_ADAPTER_URL`
    const url = this.settings[envKey as keyof BaseEndpointTypes['Settings']] || process.env[envKey]

    if (!url) {
      throw new Error(
        `No URL configured for source adapter: ${source}. Set ${envKey} environment variable.`,
      )
    }

    return url as string
  }

  private isCircuitBreakerOpen(source: string): boolean {
    const state = circuitBreakerState.get(source)
    if (!state || !state.isOpen) {
      return false
    }

    const timeoutMs = this.settings.SOURCE_CIRCUIT_BREAKER_TIMEOUT || 60000
    const timeSinceFailure = Date.now() - state.lastFailureTime

    if (timeSinceFailure > timeoutMs) {
      state.isOpen = false
      state.failures = 0
      return false
    }

    return true
  }

  private updateCircuitBreakerState(source: string, success: boolean): void {
    const state = circuitBreakerState.get(source) || {
      failures: 0,
      lastFailureTime: 0,
      isOpen: false,
    }

    if (success) {
      state.failures = 0
      state.isOpen = false
    } else {
      state.failures++
      state.lastFailureTime = Date.now()

      const threshold = this.settings.SOURCE_CIRCUIT_BREAKER_THRESHOLD || 5
      if (state.failures >= threshold) {
        state.isOpen = true
        logger.warn(`Circuit breaker opened for source ${source} after ${state.failures} failures`)
      }
    }

    circuitBreakerState.set(source, state)
  }
}

export const transport = new ComputedPriceTransport()
