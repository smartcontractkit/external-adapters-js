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
import { getProviderUrl } from '../utils/validation'

const logger = makeLogger('ReservesTransport')

type ComponentParam = RequestParams['components'][number]
type ConversionParam = RequestParams['conversions'][number]
type BalanceSourceParam = RequestParams['balanceSources'][number]

type FetchedComponent = {
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
  responseCache!: ResponseCache<ReservesTransportTypes>
  requester!: Requester

  async initialize(
    dependencies: TransportDependencies<ReservesTransportTypes>,
    adapterSettings: ReservesTransportTypes['Settings'],
    endpointName: string,
    transportName: string,
  ): Promise<void> {
    await super.initialize(dependencies, adapterSettings, endpointName, transportName)
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
        this.fetchComponent(context, component, addressListMap, balanceSourceMap, resultDecimals),
      ),
    )

    const conversionRates = []

    for (const conversion of conversions) {
      const { from, to } = conversion
      conversionRates.push({
        from,
        to,
        rate: fixedPointToNumber(await conversion.rate),
      })
    }

    for (const component of components) {
      for (const conversionName of component.conversions) {
        const [from, to] = conversionName.split('/')
        const conversion = conversions.find(
          (c) => (c.from === from && c.to === to) || (c.from === to && c.to === from),
        )
        if (conversion === undefined) {
          throw new AdapterError({
            statusCode: 500,
            message: `Conversion rate not found for conversion '${conversionName}' needed for component '${component.name}'.`,
          })
        }
        component.currency = to
        if (from === conversion.from) {
          component.totalBalance = multiply(component.totalBalance, await conversion.rate)
        } else {
          component.totalBalance = divide(component.totalBalance, await conversion.rate)
        }
      }
    }

    const componentsForResponse = components.map((component) => {
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

    //console.log('dskloetx _handleRequest components after conversion', components)

    const currencies = new Set(components.map((component) => component.currency))
    if (currencies.size > 1) {
      throw new AdapterError({
        statusCode: 500,
        message: `Can't add up balances in different currencies: ${Array.from(currencies).join(
          ', ',
        )}.`,
      })
    }

    let totalReserves = components.reduce((acc, component) => add(acc, component.totalBalance), {
      amount: 0n,
      decimals: 0,
    } as FixedPoint)

    totalReserves = toFixedPointWithDecimals(totalReserves, params.resultDecimals)

    const result = totalReserves.amount.toString()
    const resultAsNumber = fixedPointToNumber(totalReserves)
    const decimals = totalReserves.decimals

    return {
      data: {
        result,
        resultAsNumber,
        decimals,
        components: componentsForResponse,
        conversionRates,
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
    if (addressListParams.fixed !== undefined) {
      const addressArray = JSON.parse(addressListParams.fixed)
      if (!Array.isArray(addressArray)) {
        throw new AdapterError({
          statusCode: 500,
          message: `Expected an array of addresses in fixed value for address list '${addressListParams.name}'. Found '${addressListParams.fixed}'.`,
        })
      }
      return addressArray
    }
    if (
      addressListParams.provider === undefined ||
      addressListParams.params === undefined ||
      addressListParams.addressArrayPath === undefined
    ) {
      throw new AdapterError({
        statusCode: 500,
        message: `Missing provider, params, or addressArrayPath for address list '${addressListParams.name}'. These fields are required when 'fixed' value is not provided.`,
      })
    }

    const addressResponseData = await this.fetchData({
      context,
      provider: addressListParams.provider,
      params: JSON.parse(addressListParams.params),
    })
    //console.log('dskloetx fetchAddressList 3 addressResponseData', addressResponseData)
    const addressArray = objectPath.get(addressResponseData, addressListParams.addressArrayPath)
    if (addressArray === undefined) {
      throw new AdapterError({
        statusCode: 500,
        // TODO: Include short version of response.
        message: `Address array not found at path ${addressListParams.addressArrayPath} in response from provider ${addressListParams.provider}`,
      })
    }
    if (!Array.isArray(addressArray)) {
      throw new AdapterError({
        statusCode: 500,
        message: `Expected an array of addresses at path ${
          addressListParams.addressArrayPath
        } in response from provider ${addressListParams.provider}. Found '${JSON.stringify(
          addressArray,
        )}'.`,
      })
    }
    return addressArray
    //console.log('dskloetx fetchAddressList 4 addressArray', addressArray)
  }

  async fetchComponent(
    context: EndpointContext<ReservesTransportTypes>,
    component: ComponentParam,
    addressListMap: Record<string, Promise<unknown[]>>,
    balanceSourceMap: Record<string, BalanceSourceParam>,
    resultDecimals: number,
  ): Promise<FetchedComponent> {
    try {
      const balanceSource = balanceSourceMap[component.balanceSource]
      if (balanceSource === undefined) {
        throw new AdapterError({
          statusCode: 500,
          message: `Balance source '${component.balanceSource}' not found for component '${component.name}'.`,
        })
      }
      const balanceProviderAddressParams = {}
      //console.log('dskloetx fetchComponent 1 component', component)
      if (component.addressList !== undefined && balanceSource.addressArrayPath !== undefined) {
        //console.log('dskloetx fetchComponent 2 component.address', component.addresses)
        const addressArray = await addressListMap[component.addressList]
        //console.log('dskloetx fetchComponent 4 addressArray', addressArray)
        objectPath.set(balanceProviderAddressParams, balanceSource.addressArrayPath, addressArray)
        /*
        console.log(
          'dskloetx fetchComponent 5 balanceProviderAddressParams',
          balanceProviderAddressParams,
        )
        */
      } else if (
        component.addressList !== undefined ||
        balanceSource.addressArrayPath !== undefined
      ) {
        throw new AdapterError({
          statusCode: 500,
          message: `If one of addressList or addressArrayPath is specified for component '${component.name}', both must be specified.`,
        })
      }

      // Don't merge like this:
      const balanceProviderParams = {
        ...JSON.parse(balanceSource.params),
        ...balanceProviderAddressParams,
      }
      //console.log('dskloetx fetchComponent 6 balanceProviderParams', balanceProviderParams)

      const responseData = await this.fetchData({
        context,
        provider: balanceSource.provider,
        params: balanceProviderParams,
      })
      //console.log('dskloet _fetchComponent 4 responseData', responseData)
      const array: Record<string, unknown>[] =
        balanceSource.balancesArrayPath !== undefined
          ? objectPath.get(responseData, balanceSource.balancesArrayPath)
          : [responseData]
      if (array === undefined) {
        throw new AdapterError({
          statusCode: 500,
          message: `Balances array not found at path '${balanceSource.balancesArrayPath}' in response from provider '${balanceSource.provider}'`,
        })
      }
      if (!Array.isArray(array)) {
        throw new AdapterError({
          statusCode: 500,
          message: `Expected an array of balance items at path '${
            balanceSource.balancesArrayPath
          }' in response from provider '${balanceSource.provider}'. Found '${JSON.stringify(
            array,
          )}'.`,
        })
      }
      //console.log('dskloet _fetchComponent 5 array', array)
      const balances: FixedPoint[] = array.map((item) => {
        return getFixedPointFromResult({
          result: item,
          amountPath: balanceSource.balancePath,
          decimalsPath: balanceSource.decimalsPath,
          defaultDecimals: resultDecimals,
        })
      })
      //console.log('dskloet _fetchComponent 6 balances', balances)

      const totalBalance = balances.reduce((acc, balance) => add(acc, balance), {
        amount: 0n,
        decimals: 0,
      })

      return {
        name: component.name,
        currency: component.currency,
        conversions: component.conversions,
        totalBalance,
        originalCurrency: component.currency,
        totalBalanceInOriginalCurrency: totalBalance,
        addressCount: balanceSource.balancesArrayPath !== undefined ? balances.length : undefined,
      }
    } catch (error: unknown) {
      if (error instanceof AdapterError) {
        //console.log('dskloetx error processing component', component.name, error)
        const message = `Error processing component '${component.name}': ${error.message}`
        throw new AdapterError({
          statusCode: error.statusCode,
          message,
        })
      }
      throw error
    }
  }

  async fetchData({
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
        message: `Error fetching data from provider ${provider} at '${url}': ${providerErrorMessage}`,
      })
    }
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
    const responseData = await this.fetchData({
      context,
      provider: conversion.provider,
      params: JSON.parse(conversion.params),
    })
    return getFixedPointFromResult({
      result: responseData,
      amountPath: conversion.ratePath,
      decimalsPath: conversion.decimalsPath,
      defaultDecimals: resultDecimals,
    })
  }

  getSubscriptionTtlFromConfig(adapterSettings: ReservesTransportTypes['Settings']): number {
    return adapterSettings.WARMUP_SUBSCRIPTION_TTL
  }
}

export const reservesTransport = new ReservesTransport()
