import { BaseEndpointTypes, RequestParams } from '../endpoint/reserves'
import {
  divide,
  FixedPoint,
  fixedPointToNumber,
  getFixedPointFromResult,
  multiply,
} from '../utils/fixed-point'
import { Fetcher, ProcessedComponent, Stringifier } from './types'

type ConversionConfig = RequestParams['conversions'][number]
type ConversionRateForResponse = BaseEndpointTypes['Response']['Data']['conversionRates'][number]

export class Conversion {
  readonly from: string
  readonly to: string
  readonly rate: Promise<FixedPoint>
  private defaultDecimals: number
  private fetchFromProvider: Fetcher
  private shortJsonForError: Stringifier

  constructor({
    config,
    defaultDecimals,
    fetchFromProvider,
    shortJsonForError,
  }: {
    config: ConversionConfig
    defaultDecimals: number
    fetchFromProvider: Fetcher
    shortJsonForError: Stringifier
  }) {
    this.from = config.from
    this.to = config.to
    this.defaultDecimals = defaultDecimals
    this.fetchFromProvider = fetchFromProvider
    this.shortJsonForError = shortJsonForError
    this.rate = this._fetchConversionRate(config)
  }

  async _fetchConversionRate(config: ConversionConfig): Promise<FixedPoint> {
    const responseData = await this.fetchFromProvider(config.provider, JSON.parse(config.params))
    try {
      return getFixedPointFromResult({
        result: responseData,
        amountPath: config.ratePath,
        decimalsPath: config.decimalsPath,
        defaultDecimals: this.defaultDecimals,
      })
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      throw new Error(
        `Error fetching conversion rate for '${config.from}/${
          config.to
        }': ${errorMessage} for response '${this.shortJsonForError(responseData)}' from provider '${
          config.provider
        }'`,
      )
    }
  }

  getRateForResponse(): Promise<ConversionRateForResponse> {
    return this.rate.then((rate) => ({
      from: this.from,
      to: this.to,
      rate: fixedPointToNumber(rate),
    }))
  }
}

export class ConversionRepo {
  readonly conversions: Conversion[]

  constructor({
    config,
    defaultDecimals,
    fetchFromProvider,
    shortJsonForError,
  }: {
    config: ConversionConfig[]
    defaultDecimals: number
    fetchFromProvider: Fetcher
    shortJsonForError: Stringifier
  }) {
    this.conversions = config.map(
      (conversionConfig) =>
        new Conversion({
          config: conversionConfig,
          defaultDecimals,
          fetchFromProvider,
          shortJsonForError,
        }),
    )
  }

  async applyConversions(
    conversionsToApply: string[],
    component: ProcessedComponent,
  ): Promise<void> {
    for (const conversionToApply of conversionsToApply) {
      await this.applyConversion(conversionToApply, component)
    }
  }

  async applyConversion(conversionToApply: string, component: ProcessedComponent): Promise<void> {
    const [from, to] = conversionToApply.split('/')
    const { conversion, operation } = this.findConversion(from, to)

    component.currency = to
    if (operation === 'multiply') {
      component.totalBalance = multiply(component.totalBalance, await conversion.rate)
    } else {
      component.totalBalance = divide(component.totalBalance, await conversion.rate)
    }
  }

  findConversion(
    from: string,
    to: string,
  ): { conversion: Conversion; operation: 'multiply' | 'divide' } {
    // Validation guarantees that the conversion exists.
    const conversion = this.conversions.find(
      (c) => (c.from === from && c.to === to) || (c.from === to && c.to === from),
    )!
    const operation = conversion.from === from ? 'multiply' : 'divide'
    return { conversion, operation }
  }

  getRatesForResponse(): Promise<ConversionRateForResponse[]> {
    return Promise.all(this.conversions.map((conversion) => conversion.getRateForResponse()))
  }
}
