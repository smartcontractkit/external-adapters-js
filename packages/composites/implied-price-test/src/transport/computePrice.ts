import { EndpointContext } from '@chainlink/external-adapter-framework/adapter'
import { ResponseCache } from '@chainlink/external-adapter-framework/cache/response'
import { TransportDependencies } from '@chainlink/external-adapter-framework/transports'
import { SubscriptionTransport } from '@chainlink/external-adapter-framework/transports/abstract/subscription'
import { AdapterResponse, makeLogger, sleep } from '@chainlink/external-adapter-framework/util'
import { Requester } from '@chainlink/external-adapter-framework/util/requester'
import { AdapterError } from '@chainlink/external-adapter-framework/validation/error'
import { BaseEndpointTypes, inputParameters } from '../endpoint/computedPrice'
import { calculateMedian } from './utils'

const logger = makeLogger('ComputedPriceTransport')

type RequestParams = typeof inputParameters.validated

export type ComputedPriceTransportTypes = BaseEndpointTypes & {
  Provider: {
    RequestBody: never
    ResponseBody: any
  }
}

export class ComputedPriceTransport extends SubscriptionTransport<ComputedPriceTransportTypes> {
  name!: string
  responseCache!: ResponseCache<ComputedPriceTransportTypes>
  requester!: Requester
  settings!: ComputedPriceTransportTypes['Settings']

  async initialize(
    dependencies: TransportDependencies<ComputedPriceTransportTypes>,
    adapterSettings: ComputedPriceTransportTypes['Settings'],
    endpointName: string,
    transportName: string,
  ): Promise<void> {
    await super.initialize(dependencies, adapterSettings, endpointName, transportName)
    this.requester = dependencies.requester
    this.settings = adapterSettings
    this.name = transportName
  }

  async backgroundHandler(
    context: EndpointContext<ComputedPriceTransportTypes>,
    entries: RequestParams[],
  ) {
    await Promise.all(entries.map(async (param) => this.handleRequest(param)))
    await sleep(context.adapterSettings.BACKGROUND_EXECUTE_MS)
  }

  async handleRequest(param: RequestParams) {
    let response: AdapterResponse<ComputedPriceTransportTypes['Response']>
    try {
      response = await this._handleRequest(param)
    } catch (e) {
      const errorMessage = e instanceof Error ? e.message : 'Unknown error occurred'
      logger.error(e, errorMessage)
      response = {
        statusCode: (e as AdapterError)?.statusCode || 502,
        errorMessage,
        timestamps: {
          providerDataRequestedUnixMs: 0,
          providerDataReceivedUnixMs: 0,
          providerIndicatedTimeUnixMs: undefined,
        },
      }
    }
    await this.responseCache.write(this.name, [{ params: param, response }])
  }

  async _handleRequest(
    param: RequestParams,
  ): Promise<AdapterResponse<ComputedPriceTransportTypes['Response']>> {
    const {
      operand1Sources,
      operand2Sources,
      operand1MinAnswers,
      operand2MinAnswers,
      operand1Input,
      operand2Input,
      operation,
    } = param

    logger.debug(
      `Processing computed price calculation: ${JSON.stringify({
        operand1Sources,
        operand2Sources,
        operand1MinAnswers,
        operand2MinAnswers,
        operand1Input,
        operand2Input,
        operation,
      })}`,
    )
    const providerDataRequestedUnixMs = Date.now()

    const operand1SourceUrls = this.getOperandSourceUrls(operand1Sources)
    const operand2SourceUrls = this.getOperandSourceUrls(operand2Sources)

    // Fetch data from sources for both operands
    const [operand1Result, operand2Result] = await Promise.all([
      this.fetchFromSources(operand1SourceUrls, operand1Input, operand1MinAnswers),
      this.fetchFromSources(operand2SourceUrls, operand2Input, operand2MinAnswers),
    ])

    // Get the median
    const operand1Median = calculateMedian(operand1Result)
    const operand2Median = calculateMedian(operand2Result)

    if (operand1Median.isZero()) {
      throw new Error('operand1Median result is zero')
    }

    if (operand2Median.isZero()) {
      throw new Error('operand2Median result is zero')
    }

    const result =
      operation === 'divide'
        ? operand1Median.div(operand2Median).toFixed()
        : operand1Median.mul(operand2Median).toFixed()

    return {
      data: {
        result: result,
      },
      statusCode: 200,
      result: result,
      timestamps: {
        providerDataRequestedUnixMs,
        providerDataReceivedUnixMs: Date.now(),
        providerIndicatedTimeUnixMs: undefined,
      },
    }
  }

  getSubscriptionTtlFromConfig(adapterSettings: ComputedPriceTransportTypes['Settings']): number {
    return adapterSettings.WARMUP_SUBSCRIPTION_TTL
  }

  private async fetchFromSources(
    sources: string[],
    input: string,
    minAnswers: number,
  ): Promise<number[]> {
    const promises = sources.map(async (url) => {
      try {
        const requestConfig = {
          url,
          method: 'POST',
          data: { data: JSON.parse(input) },
        }
        const result = await this.requester.request<{ result?: number }>(
          JSON.stringify(requestConfig),
          requestConfig,
        )
        return { url, success: true, result }
      } catch (error) {
        logger.error(`Error fetching from source ${url}: ${error}`)
        return { url, success: false, error }
      }
    })

    const results = await Promise.all(promises)

    const successfulResults = results.filter((r) => r.success).map((r) => r.result)

    if (successfulResults.length < minAnswers) {
      throw new Error(
        `Insufficient responses: got ${successfulResults.length}, required ${minAnswers}`,
      )
    }

    return successfulResults.map((r) => r?.response.data.result as number)
  }

  private getOperandSourceUrls(sources: string[]): string[] {
    return sources
      .map((source) => process.env[`${source.toUpperCase()}_ADAPTER_URL`])
      .filter((url) => url) as string[]
  }
}

export const computedPriceTransport = new ComputedPriceTransport()
