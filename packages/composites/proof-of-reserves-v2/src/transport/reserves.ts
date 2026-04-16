import { EndpointContext } from '@chainlink/external-adapter-framework/adapter'
import { calculateHttpRequestKey } from '@chainlink/external-adapter-framework/cache'
import { ResponseCache } from '@chainlink/external-adapter-framework/cache/response'
import { TransportDependencies } from '@chainlink/external-adapter-framework/transports'
import { SubscriptionTransport } from '@chainlink/external-adapter-framework/transports/abstract/subscription'
import { AdapterResponse, makeLogger, sleep } from '@chainlink/external-adapter-framework/util'
import { Requester } from '@chainlink/external-adapter-framework/util/requester'
import { AdapterError } from '@chainlink/external-adapter-framework/validation/error'
import { BaseEndpointTypes, RequestParams } from '../endpoint/reserves'
import { add, fixedPointToNumber, toFixedPointWithDecimals } from '../utils/fixed-point'
import { getProviderUrl } from '../utils/validation'
import { AddressListRepo } from './address'
import { BalanceSourceRepo } from './balance'
import { Conversion, ConversionRepo } from './conversion'
import { ProcessedComponent } from './types'

const logger = makeLogger('ReservesTransport')

type ComponentParam = RequestParams['components'][number]

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
    const fetchFromProvider = this.fetchFromProvider.bind(this, context)
    const shortJsonForError = this.shortJsonForError.bind(this)

    const addressListRepo = new AddressListRepo({
      config: params.addressLists,
      fetchFromProvider,
      shortJsonForError,
    })

    const balanceSourceRepo = new BalanceSourceRepo({
      config: params.balanceSources,
      defaultDecimals: resultDecimals,
      fetchFromProvider,
      shortJsonForError,
    })

    const conversionRepo = new ConversionRepo({
      config: params.conversions,
      defaultDecimals: resultDecimals,
      fetchFromProvider,
      shortJsonForError,
    })

    const components = await Promise.all(
      params.components.map((component) =>
        this.processComponent({
          component,
          addressListRepo,
          balanceSourceRepo,
          conversionRepo,
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
        conversionRates: await this.createConversionRatesForResponse(conversionRepo.conversions),
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

  async processComponent({
    component,
    addressListRepo,
    balanceSourceRepo,
    conversionRepo,
  }: {
    component: ComponentParam
    addressListRepo: AddressListRepo
    balanceSourceRepo: BalanceSourceRepo
    conversionRepo: ConversionRepo
  }): Promise<ProcessedComponent> {
    try {
      const addressArray = await addressListRepo.getAddressArray(component.addressList)

      const { balances, addressCount } = await balanceSourceRepo.fetchBalances(
        component.balanceSource,
        addressArray,
      )

      const totalBalance = balances.reduce((acc, balance) => add(acc, balance), {
        amount: 0n,
        decimals: 0,
      })

      const processedComponent: ProcessedComponent = {
        name: component.name,
        currency: component.currency,
        totalBalance,
        originalCurrency: component.currency,
        totalBalanceInOriginalCurrency: totalBalance,
        addressCount,
      }

      conversionRepo.applyConversions(component.conversions, processedComponent)

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
    conversions: Conversion[],
  ): Promise<BaseEndpointTypes['Response']['Data']['conversionRates']> {
    return Promise.all(
      conversions.map(async (conversion) => ({
        from: conversion.from,
        to: conversion.to,
        rate: fixedPointToNumber(await conversion.rate),
      })),
    )
  }

  async fetchFromProvider(
    context: EndpointContext<ReservesTransportTypes>,
    provider: string,
    params: Record<string, unknown>,
  ): Promise<Record<string, unknown>> {
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
