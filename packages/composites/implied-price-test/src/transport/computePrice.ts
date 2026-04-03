/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { EndpointContext } from '@chainlink/external-adapter-framework/adapter'
import { TransportDependencies } from '@chainlink/external-adapter-framework/transports'
import { SubscriptionTransport } from '@chainlink/external-adapter-framework/transports/abstract/subscription'
import { AdapterResponse, makeLogger, sleep } from '@chainlink/external-adapter-framework/util'
import { Requester } from '@chainlink/external-adapter-framework/util/requester'
import { AdapterError } from '@chainlink/external-adapter-framework/validation/error'
import Decimal from 'decimal.js'
import { BaseEndpointTypes, inputParameters } from '../endpoint/computedPrice'
import { calculateMedian, getOperandSourceUrls } from './utils'

const scaleValue = (value: Decimal, inputDecimals: number, outputDecimals: number): Decimal =>
  value.div(new Decimal(10).pow(inputDecimals)).mul(new Decimal(10).pow(outputDecimals))

const decimalToString = (value: Decimal): string => {
  const str = value.toString()
  return str.includes('e+') ? value.toFixed() : str
}

const logger = makeLogger('ComputedPriceTransport')

type RequestParams = typeof inputParameters.validated

export type ComputedPriceTransportTypes = BaseEndpointTypes & {
  Provider: {
    RequestBody: never
    ResponseBody: any
  }
}

export class ComputedPriceTransport extends SubscriptionTransport<ComputedPriceTransportTypes> {
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
      operand1Decimals,
      operand2Decimals,
      operation,
      outputDecimals,
    } = param

    logger.debug(
      `Processing computed price calculation: ${JSON.stringify({
        operand1Sources,
        operand2Sources,
        operand1MinAnswers,
        operand2MinAnswers,
        operand1Input,
        operand2Input,
        operand1Decimals,
        operand2Decimals,
        operation,
        outputDecimals,
      })}`,
    )
    const providerDataRequestedUnixMs = Date.now()

    const operand1SourceUrls = getOperandSourceUrls(operand1Sources)
    const operand2SourceUrls = getOperandSourceUrls(operand2Sources)

    // Fetch data from sources for both operands
    const [operand1Results, operand2Results] = await Promise.all([
      this.fetchFromSources(operand1SourceUrls, operand1Input, operand1MinAnswers),
      this.fetchFromSources(operand2SourceUrls, operand2Input, operand2MinAnswers),
    ])

    // Get the median
    const operand1Median = calculateMedian(operand1Results)
    const operand2Median = calculateMedian(operand2Results)

    if (operand1Median.isZero()) {
      throw new Error('operand1Median result is zero')
    }

    if (operand2Median.isZero()) {
      throw new Error('operand2Median result is zero')
    }

    // *Decimals input param all/none present validation performed at the endpoint level
    const areDecimalsDefined = outputDecimals !== undefined

    // Scale operands down to 0 decimals if decimals are defined
    const scaledOperand1 = areDecimalsDefined
      ? scaleValue(operand1Median, operand1Decimals!, 0)
      : operand1Median
    const scaledOperand2 = areDecimalsDefined
      ? scaleValue(operand2Median, operand2Decimals!, 0)
      : operand2Median

    let computedResult: Decimal
    if (operation.toLowerCase() === 'divide') {
      computedResult = scaledOperand1.div(scaledOperand2)
    } else if (operation.toLowerCase() === 'multiply') {
      computedResult = scaledOperand1.mul(scaledOperand2)
    } else {
      throw new AdapterError({
        message: `Unsupported operation: ${operation}. This should not be possible because of input validation.`,
      })
    }

    // Scale result up to output decimals if decimals are defined
    if (areDecimalsDefined) {
      computedResult = scaleValue(computedResult, 0, outputDecimals!)
    }

    const result = computedResult.toFixed()

    return {
      data: {
        result,
        operand1Result: decimalToString(operand1Median),
        operand2Result: decimalToString(operand2Median),
        ...(areDecimalsDefined && {
          operand1Decimals: operand1Decimals!,
          operand2Decimals: operand2Decimals!,
          resultDecimals: outputDecimals!,
        }),
      },
      statusCode: 200,
      result,
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
  ): Promise<Decimal[]> {
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

    return successfulResults.map((r) => new Decimal(r?.response.data.result as number))
  }
}

export const computedPriceTransport = new ComputedPriceTransport()
