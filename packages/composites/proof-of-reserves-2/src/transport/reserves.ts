import { EndpointContext } from '@chainlink/external-adapter-framework/adapter'
import { calculateHttpRequestKey } from '@chainlink/external-adapter-framework/cache'
import { ResponseCache } from '@chainlink/external-adapter-framework/cache/response'
import { TransportDependencies } from '@chainlink/external-adapter-framework/transports'
import { SubscriptionTransport } from '@chainlink/external-adapter-framework/transports/abstract/subscription'
import { AdapterResponse, makeLogger, sleep } from '@chainlink/external-adapter-framework/util'
import { Requester } from '@chainlink/external-adapter-framework/util/requester'
import { AdapterError } from '@chainlink/external-adapter-framework/validation/error'
import objectPath from 'object-path'
import { BaseEndpointTypes, RequestParams } from '../endpoint/reserves'
import {
  FixedPoint,
  add,
  divide,
  fixedPointToNumber,
  getFixedPointFromResult,
  multiply,
  toFixedPointWithDecimals,
} from '../utils/fixed-point'
import { checkAddressList, getProviderUrl } from '../utils/validation'

const logger = makeLogger('ReservesTransport')

type ComponentParam = RequestParams['components'][number]
type ConversionParam = RequestParams['conversions'][number]
type BalanceSourceParam = RequestParams['balanceSources'][number]

type ProcessedComponent = {
  name: string
  currency: string
  conversions: string[]
  totalBalance: FixedPoint
  originalCurrency: string
  totalBalanceInOriginalCurrency: FixedPoint
  addressCount?: number
}

type FetchedConversion = {
  from: string
  to: string
  rate: Promise<FixedPoint>
}

export type ReservesTransportTypes = BaseEndpointTypes & {
  Provider: {
    RequestBody: never
    ResponseBody: any
  }
}

export class ReservesTransport extends SubscriptionTransport<ReservesTransportTypes> {
  name!: string
  config!: ReservesTransportTypes['Settings']
  responseCache!: ResponseCache<ReservesTransportTypes>
  requester!: Requester

  async initialize(
    dependencies: TransportDependencies<ReservesTransportTypes>,
    adapterSettings: ReservesTransportTypes['Settings'],
    endpointName: string,
    transportName: string,
  ): Promise<void> {
    await super.initialize(dependencies, adapterSettings, endpointName, transportName)
    this.config = adapterSettings
    this.requester = dependencies.requester
  }
  async backgroundHandler(
    context: EndpointContext<ReservesTransportTypes>,
    entries: RequestParams[],
  ) {
    await Promise.all(entries.map(async (param) => this.handleRequest(context, param)))
    await sleep(context.adapterSettings.BACKGROUND_EXECUTE_MS)
  }

  async handleRequest(context: EndpointContext<ReservesTransportTypes>, param: RequestParams) {
    let response: AdapterResponse<ReservesTransportTypes['Response']>
    try {
      response = await this._handleRequest(context, param)
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
    context: EndpointContext<ReservesTransportTypes>,
    params: RequestParams,
  ): Promise<AdapterResponse<ReservesTransportTypes['Response']>> {
    const providerDataRequestedUnixMs = Date.now()

    const resultDecimals = params.resultDecimals
    const addressListMap = this.fetchAddressLists(context, params.addressLists)
    const balanceSourceMap = Object.fromEntries(
      params.balanceSources.map((source) => [source.name, source]),
    )
    const conversions = params.conversions.map((conversion) =>
      this.fetchConversion(context, conversion, resultDecimals),
    )

    const components = await Promise.all(
      params.components.map((component) =>
        this.processComponent({
          context,
          component,
          addressListMap,
          balanceSourceMap,
          conversions,
          defaultDecimals: resultDecimals,
        }),
      ),
    )

    const totalReserves = toFixedPointWithDecimals(
      components.reduce((acc, component) => add(acc, component.totalBalance), {
        amount: 0n,
        decimals: 0,
      }),
      params.resultDecimals,
    )

    const result = totalReserves.amount.toString()
    const resultAsNumber = fixedPointToNumber(totalReserves)
    const decimals = totalReserves.decimals

    return {
      data: {
        result,
        resultAsNumber,
        decimals,
        components: this.createComponentsForResponse(components),
        conversionRates: await this.createConversionRatesForResponse(conversions),
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

  fetchAddressLists(
    context: EndpointContext<ReservesTransportTypes>,
    addressListsParams: RequestParams['addressLists'],
  ): Record<string, Promise<unknown[]>> {
    return Object.fromEntries(
      addressListsParams.map((addressListParams) => {
        return [addressListParams.name, this.fetchAddressList(context, addressListParams)]
      }),
    )
  }

  async fetchAddressList(
    context: EndpointContext<ReservesTransportTypes>,
    addressListParams: RequestParams['addressLists'][number],
  ): Promise<unknown[]> {
    checkAddressList(addressListParams)

    if (addressListParams.fixed !== undefined) {
      // Was already validated to be a JSON array string in validation.
      return JSON.parse(addressListParams.fixed)
    }

    const addressResponseData = await this.fetchFromProvider({
      context,
      provider: addressListParams.provider,
      params: JSON.parse(addressListParams.params),
    })
    const addressArray = objectPath.get(addressResponseData, addressListParams.addressArrayPath)

    if (addressArray === undefined) {
      throw new Error(
        `Address array not found at path '${
          addressListParams.addressArrayPath
        }' in response '${this.shortJsonForError(addressResponseData)}' from provider '${
          addressListParams.provider
        }'`,
      )
    }
    if (!Array.isArray(addressArray)) {
      throw new Error(
        `Expected an array of addresses at path ${
          addressListParams.addressArrayPath
        } in response from provider ${addressListParams.provider}. Found '${this.shortJsonForError(
          addressArray,
        )}'.`,
      )
    }

    return addressArray
  }

  fetchConversion(
    context: EndpointContext<ReservesTransportTypes>,
    conversion: ConversionParam,
    resultDecimals: number,
  ): FetchedConversion {
    return {
      from: conversion.from,
      to: conversion.to,
      rate: this.fetchConversionRate(context, conversion, resultDecimals),
    }
  }

  async fetchConversionRate(
    context: EndpointContext<ReservesTransportTypes>,
    conversion: ConversionParam,
    resultDecimals: number,
  ): Promise<FixedPoint> {
    const responseData = await this.fetchFromProvider({
      context,
      provider: conversion.provider,
      params: JSON.parse(conversion.params),
    })
    try {
      return getFixedPointFromResult({
        result: responseData,
        amountPath: conversion.ratePath,
        decimalsPath: conversion.decimalsPath,
        defaultDecimals: resultDecimals,
      })
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      throw new Error(
        `Error fetching conversion rate for '${conversion.from}/${
          conversion.to
        }': ${errorMessage} for response '${this.shortJsonForError(responseData)}' from provider '${
          conversion.provider
        }'`,
      )
    }
  }

  async applyConversion({
    component,
    conversionName,
    conversions,
  }: {
    component: ProcessedComponent
    conversionName: string
    conversions: FetchedConversion[]
  }): Promise<void> {
    const [from, to] = conversionName.split('/')
    // Validation guarantees that the conversion exists.
    const conversion = conversions.find(
      (c) => (c.from === from && c.to === to) || (c.from === to && c.to === from),
    )!
    component.currency = to
    if (from === conversion.from) {
      component.totalBalance = multiply(component.totalBalance, await conversion.rate)
    } else {
      component.totalBalance = divide(component.totalBalance, await conversion.rate)
    }
  }

  async processComponent({
    context,
    component,
    addressListMap,
    balanceSourceMap,
    conversions,
    defaultDecimals,
  }: {
    context: EndpointContext<ReservesTransportTypes>
    component: ComponentParam
    addressListMap: Record<string, Promise<unknown[]>>
    balanceSourceMap: Record<string, BalanceSourceParam>
    conversions: FetchedConversion[]
    defaultDecimals: number
  }): Promise<ProcessedComponent> {
    try {
      // Vadidation guarantees that balanceSource exists for the component.
      const balanceSource = balanceSourceMap[component.balanceSource]!

      const balances = await this.fetchBalancesForComponent({
        context,
        component,
        addressListMap,
        balanceSource,
        defaultDecimals,
      })

      const totalBalance = balances.reduce((acc, balance) => add(acc, balance), {
        amount: 0n,
        decimals: 0,
      })

      const processedComponent: ProcessedComponent = {
        name: component.name,
        currency: component.currency,
        conversions: component.conversions,
        totalBalance,
        originalCurrency: component.currency,
        totalBalanceInOriginalCurrency: totalBalance,
        addressCount: balanceSource.balancesArrayPath !== undefined ? balances.length : undefined,
      }

      for (const conversionName of component.conversions) {
        await this.applyConversion({ component: processedComponent, conversionName, conversions })
      }
      return processedComponent
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      const statusCode = error instanceof AdapterError ? error.statusCode : 500
      throw new AdapterError({
        statusCode,
        message: `Error processing component '${component.name}': ${errorMessage}`,
      })
    }
  }

  async fetchBalancesForComponent({
    context,
    component,
    addressListMap,
    balanceSource,
    defaultDecimals,
  }: {
    context: EndpointContext<ReservesTransportTypes>
    component: ComponentParam
    addressListMap: Record<string, Promise<unknown[]>>
    balanceSource: BalanceSourceParam
    defaultDecimals: number
  }): Promise<FixedPoint[]> {
    const balanceProviderParams = JSON.parse(balanceSource.params)

    if (component.addressList !== undefined && balanceSource.addressArrayPath !== undefined) {
      const addressArray = await addressListMap[component.addressList]
      objectPath.set(balanceProviderParams, balanceSource.addressArrayPath, addressArray)
    }

    const responseData = await this.fetchFromProvider({
      context,
      provider: balanceSource.provider,
      params: balanceProviderParams,
    })

    const balanceArray: Record<string, unknown>[] =
      balanceSource.balancesArrayPath !== undefined
        ? objectPath.get(responseData, balanceSource.balancesArrayPath)
        : [responseData]
    if (balanceArray === undefined) {
      throw new Error(
        `Balances array not found at path '${
          balanceSource.balancesArrayPath
        }' in response '${this.shortJsonForError(responseData)}' from provider '${
          balanceSource.provider
        }'`,
      )
    }

    if (!Array.isArray(balanceArray)) {
      throw new Error(
        `Expected an array of balance items at path '${
          balanceSource.balancesArrayPath
        }' in response from provider '${balanceSource.provider}'. Found '${this.shortJsonForError(
          balanceArray,
        )}'.`,
      )
    }

    const balances: FixedPoint[] = balanceArray.map((item) => {
      try {
        return getFixedPointFromResult({
          result: item,
          amountPath: balanceSource.balancePath,
          decimalsPath: balanceSource.decimalsPath,
          defaultDecimals,
        })
      } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error'
        throw new Error(
          `Error getting balance: ${errorMessage} for element '${this.shortJsonForError(
            item,
          )}' in response from provider '${balanceSource.provider}'`,
        )
      }
    })

    return balances
  }

  createComponentsForResponse(
    components: ProcessedComponent[],
  ): BaseEndpointTypes['Response']['Data']['components'] {
    return components.map((component) => {
      const componentForResponse: BaseEndpointTypes['Response']['Data']['components'][number] = {
        name: component.name,
        currency: component.currency,
        totalBalance: fixedPointToNumber(component.totalBalance),
        addressCount: component.addressCount,
      }
      if (component.originalCurrency !== component.currency) {
        componentForResponse.originalCurrency = component.originalCurrency
        componentForResponse.totalBalanceInOriginalCurrency = {
          amount: component.totalBalanceInOriginalCurrency.amount.toString(),
          decimals: component.totalBalanceInOriginalCurrency.decimals,
        }
      }
      return componentForResponse
    })
  }

  createConversionRatesForResponse(
    conversions: FetchedConversion[],
  ): Promise<BaseEndpointTypes['Response']['Data']['conversionRates']> {
    return Promise.all(
      conversions.map(async (conversion) => ({
        from: conversion.from,
        to: conversion.to,
        rate: fixedPointToNumber(await conversion.rate),
      })),
    )
  }

  async fetchFromProvider({
    context,
    provider,
    params,
  }: {
    context: EndpointContext<ReservesTransportTypes>
    provider: string
    params: Record<string, unknown>
  }): Promise<Record<string, unknown>> {
    const url = getProviderUrl(provider)
    const requestConfig = {
      url,
      method: 'POST',
      data: { data: params },
    }
    try {
      const requestKey = calculateHttpRequestKey({
        context,
        data: params,
        transportName: this.name,
      })
      const result = await this.requester.request(requestKey, requestConfig)
      return result.response.data as Record<string, unknown>
    } catch (error: unknown) {
      // Try to forward the error message from another adapter.
      let providerErrorMessage = (error as { errorResponse: { error: { message: string } } })
        .errorResponse?.error?.message
      if (!providerErrorMessage) {
        if (error instanceof Error) {
          providerErrorMessage = error.message
        } else {
          providerErrorMessage = String(error)
        }
      }
      throw new AdapterError({
        statusCode: 502,
        message: `Error fetching data from provider '${provider}' at '${url}': ${providerErrorMessage}`,
      })
    }
  }

  shortJsonForError(obj: unknown): string {
    const maxLen = this.config.MAX_RESPONSE_TEXT_IN_ERROR_MESSAGE
    let longString: string
    try {
      longString = JSON.stringify(obj)
    } catch {
      longString = String(obj)
    }
    return longString.length > maxLen ? `${longString.slice(0, maxLen)}...` : longString
  }

  getSubscriptionTtlFromConfig(adapterSettings: ReservesTransportTypes['Settings']): number {
    return adapterSettings.WARMUP_SUBSCRIPTION_TTL
  }
}

export const reservesTransport = new ReservesTransport()
