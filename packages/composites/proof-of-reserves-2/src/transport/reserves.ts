import { EndpointContext } from '@chainlink/external-adapter-framework/adapter'
import { calculateHttpRequestKey } from '@chainlink/external-adapter-framework/cache'
import { ResponseCache } from '@chainlink/external-adapter-framework/cache/response'
import { TransportDependencies } from '@chainlink/external-adapter-framework/transports'
import { SubscriptionTransport } from '@chainlink/external-adapter-framework/transports/abstract/subscription'
import { AdapterResponse, makeLogger, sleep } from '@chainlink/external-adapter-framework/util'
import { Requester } from '@chainlink/external-adapter-framework/util/requester'
import { AdapterError } from '@chainlink/external-adapter-framework/validation/error'
//import Decimal from 'decimal.js'
import objectPath from 'object-path'
import { BaseEndpointTypes, inputParameters } from '../endpoint/reserves'

const logger = makeLogger('CustomTransport')

type RequestParams = typeof inputParameters.validated

type FixedPoint = {
  amount: bigint
  decimals: number
}

type NumberType = FixedPoint | number

const isFixedPoint = (num: NumberType): num is FixedPoint => {
  return typeof num !== 'number' && 'amount' in num && 'decimals' in num
}

const toFixedPointWithDecimals = (num: NumberType, decimals: number): FixedPoint => {
  if (!isFixedPoint(num)) {
    return {
      amount: BigInt(num * 10 ** decimals),
      decimals,
    }
  }

  let amount = num.amount
  if (decimals !== num.decimals) {
    amount = (amount * 10n ** BigInt(decimals)) / 10n ** BigInt(num.decimals)
  }
  return {
    amount,
    decimals,
  }
}

const fixedPointToNumber = (num: FixedPoint): number => {
  return Number(num.amount) / 10 ** num.decimals
}

const add = (a: FixedPoint, b: FixedPoint): FixedPoint => {
  let resultDecimals = Math.max(a.decimals, b.decimals)
  a = toFixedPointWithDecimals(a, resultDecimals)
  b = toFixedPointWithDecimals(b, resultDecimals)
  return {
    amount: a.amount + b.amount,
    decimals: resultDecimals,
  }
}

const multiply = (a: FixedPoint, b: FixedPoint): FixedPoint => {
  const decimals = Math.max(a.decimals, b.decimals)
  const amount = (a.amount * b.amount) / 10n ** BigInt(a.decimals + b.decimals - decimals)
  return {
    amount,
    decimals,
  }
}

const divide = (a: FixedPoint, b: FixedPoint): FixedPoint => {
  const decimals = Math.max(a.decimals, b.decimals)
  const amount = (a.amount * 10n ** BigInt(decimals + b.decimals - a.decimals)) / b.amount
  return {
    amount,
    decimals,
  }
}

const getFixedPointFromResult = ({
  result,
  amountPath,
  decimalsPath,
  defaultDecimals,
}: {
  result: Record<string, unknown>
  amountPath: string
  decimalsPath: string | undefined
  defaultDecimals: number
}): FixedPoint => {
  const amount: number | string = objectPath.get(result, amountPath)
  if (amount === undefined) {
    throw new AdapterError({
      statusCode: 500,
      message: `Amount not found at path '${amountPath}' in result '${JSON.stringify(result)}'.`,
    })
  }
  if (decimalsPath) {
    const decimals = Number(objectPath.get(result, decimalsPath))
    if (!Number.isFinite(decimals)) {
      throw new AdapterError({
        statusCode: 500,
        message: `Decimals not found at path '${decimalsPath}' in result '${JSON.stringify(
          result,
        )}'.`,
      })
    }
    return {
      amount: BigInt(amount),
      decimals: decimals,
    }
  }
  return toFixedPointWithDecimals(Number(amount), defaultDecimals)
}

type ComponentParam = RequestParams['components'][number]
type ConversionParam = RequestParams['conversions'][number]

type ProcessedComponent = {
  name: string
  currency: string
  totalBalance: FixedPoint
  originalCurrency: string
  totalBalanceInOriginalCurrency: FixedPoint
  addressCount?: number
}

type ProcessedConversion = {
  from: string
  to: string
  rate: FixedPoint
  operation: 'multiply' | 'divide'
}

export type CustomTransportTypes = BaseEndpointTypes & {
  Provider: {
    RequestBody: never
    ResponseBody: any
  }
}
export class CustomTransport extends SubscriptionTransport<CustomTransportTypes> {
  name!: string
  responseCache!: ResponseCache<CustomTransportTypes>
  requester!: Requester

  async initialize(
    dependencies: TransportDependencies<CustomTransportTypes>,
    adapterSettings: CustomTransportTypes['Settings'],
    endpointName: string,
    transportName: string,
  ): Promise<void> {
    await super.initialize(dependencies, adapterSettings, endpointName, transportName)
    this.requester = dependencies.requester
  }
  async backgroundHandler(
    context: EndpointContext<CustomTransportTypes>,
    entries: RequestParams[],
  ) {
    await Promise.all(entries.map(async (param) => this.handleRequest(context, param)))
    await sleep(context.adapterSettings.BACKGROUND_EXECUTE_MS)
  }

  async handleRequest(context: EndpointContext<CustomTransportTypes>, param: RequestParams) {
    let response: AdapterResponse<CustomTransportTypes['Response']>
    try {
      response = await this._handleRequest(context, param)
    } catch (e) {
      // @ts-ignore
      console.log('dskloetx handleRequest error fetching data from provider', e.stack)
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
    context: EndpointContext<CustomTransportTypes>,
    params: RequestParams,
  ): Promise<AdapterResponse<CustomTransportTypes['Response']>> {
    const providerDataRequestedUnixMs = Date.now()

    //console.log('dskloetx _handleRequest params', JSON.stringify(params, null, 2))
    const resultDecimals = params.resultDecimals
    const [components, conversions] = await Promise.all([
      Promise.all(
        params.components.map((component) =>
          this.fetchComponent(context, component, resultDecimals),
        ),
      ),
      Promise.all(
        params.conversions.map((conversion) =>
          this.fetchConversion(context, conversion, resultDecimals),
        ),
      ),
    ])

    //console.log('dskloetx _handleRequest components', components)
    //console.log('dskloetx _handleRequest conversions', conversions)

    /*
    const componentsForResponse = components.map((component) => ({
      name: component.name,
      originalCurrency: component.currency,
      totalBalanceInOriginalCurrency: {
        amount: component.totalBalance.amount.toString(),
        decimals: compnent.totalBalance.decimals,
      },
    }))
    */

    const conversionRates = []

    for (const conversion of conversions) {
      let { from, to } = conversion
      if (conversion.operation === 'divide') {
        ;[from, to] = [to, from]
      }
      conversionRates.push({
        from,
        to,
        rate: fixedPointToNumber(conversion.rate),
      })
      console.log('dskloetx _handleRequest applying conversion', conversion)

      for (const component of components) {
        if (component.currency === conversion.from) {
          component.currency = conversion.to
          if (conversion.operation === 'multiply') {
            component.totalBalance = multiply(component.totalBalance, conversion.rate)
          } else if (conversion.operation === 'divide') {
            component.totalBalance = divide(component.totalBalance, conversion.rate)
          } else {
            throw new AdapterError({
              statusCode: 500,
              message: `Unsupported conversion operation: ${conversion.operation}`,
            })
          }
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

  async fetchComponent(
    context: EndpointContext<CustomTransportTypes>,
    component: ComponentParam,
    resultDecimals: number,
  ): Promise<ProcessedComponent> {
    try {
      let balanceProviderAddressParams = {}
      //console.log('dskloetx fetchComponent 1 component', component)
      if (component.addresses !== undefined && component.balances.addressArrayPath !== undefined) {
        //console.log('dskloetx fetchComponent 2 component.address', component.addresses)
        const addressResponseData = await this.fetchData({
          context,
          provider: component.addresses.provider,
          params: JSON.parse(component.addresses.params),
        })
        //console.log('dskloetx fetchComponent 3 addressResponseData', addressResponseData)
        const addressArray = objectPath.get(
          addressResponseData,
          component.addresses.addressArrayPath,
        )
        if (addressArray === undefined) {
          throw new AdapterError({
            statusCode: 500,
            // TODO: Include short version of response.
            message: `Address array not found at path ${component.addresses.addressArrayPath} in response from provider ${component.addresses.provider}`,
          })
        }
        if (!Array.isArray(addressArray)) {
          throw new AdapterError({
            statusCode: 500,
            message: `Expected an array of addresses at path ${
              component.addresses.addressArrayPath
            } in response from provider ${component.addresses.provider}. Found '${JSON.stringify(
              addressArray,
            )}'.`,
          })
        }
        //console.log('dskloetx fetchComponent 4 addressArray', addressArray)
        objectPath.set(
          balanceProviderAddressParams,
          component.balances.addressArrayPath,
          addressArray,
        )
        /*
        console.log(
          'dskloetx fetchComponent 5 balanceProviderAddressParams',
          balanceProviderAddressParams,
        )
        */
      }

      const balanceProviderParams = {
        ...JSON.parse(component.balances.params),
        ...balanceProviderAddressParams,
      }
      //console.log('dskloetx fetchComponent 6 balanceProviderParams', balanceProviderParams)

      const responseData = await this.fetchData({
        context,
        provider: component.balances.provider,
        params: balanceProviderParams,
      })
      //console.log('dskloet _fetchComponent 4 responseData', responseData)
      const array: Record<string, unknown>[] =
        component.balances.balancesArrayPath !== undefined
          ? objectPath.get(responseData, component.balances.balancesArrayPath)
          : [responseData]
      //console.log('dskloet _fetchComponent 5 array', array)
      const balances: FixedPoint[] = array.map((item) => {
        return getFixedPointFromResult({
          result: item,
          amountPath: component.balances.balancePath,
          decimalsPath: component.balances.decimalsPath,
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
        totalBalance,
        originalCurrency: component.currency,
        totalBalanceInOriginalCurrency: totalBalance,
        addressCount:
          component.balances.balancesArrayPath !== undefined ? balances.length : undefined,
      }
    } catch (error: unknown) {
      if (error instanceof AdapterError) {
        console.log('dskloetx error processing component', component.name, error)
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
    context: EndpointContext<CustomTransportTypes>
    provider: string
    params: Record<string, unknown>
  }): Promise<Record<string, unknown>> {
    const providerUrlEnvVarName = `${provider.replace(/\W/g, '_').toUpperCase()}_URL`
    const url = process.env[providerUrlEnvVarName]
    if (!url) {
      throw new AdapterError({
        statusCode: 500,
        message: `Missing environment variable for provider URL: ${providerUrlEnvVarName}`,
      })
    }
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
      //const requestKey = JSON.stringify(requestConfig)
      const result = await this.requester.request(requestKey, requestConfig)
      return result.response.data as Record<string, unknown>
    } catch (error: unknown) {
      let providerErrorMessage = (error as { errorResponse: { error: { message: string } } })
        .errorResponse?.error?.message
      // @ts-ignore
      console.log('dskloetx error fetching data 2 from provider', providerErrorMessage)
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

  async fetchConversion(
    context: EndpointContext<CustomTransportTypes>,
    conversion: ConversionParam,
    resultDecimals: number,
  ): Promise<ProcessedConversion> {
    const responseData = await this.fetchData({
      context,
      provider: conversion.provider,
      params: JSON.parse(conversion.params),
    })
    const rate = getFixedPointFromResult({
      result: responseData,
      amountPath: conversion.ratePath,
      decimalsPath: conversion.decimalsPath,
      defaultDecimals: resultDecimals,
    })

    return {
      from: conversion.from,
      to: conversion.to,
      rate,
      operation: conversion.operation,
    }
  }

  getSubscriptionTtlFromConfig(adapterSettings: CustomTransportTypes['Settings']): number {
    return adapterSettings.WARMUP_SUBSCRIPTION_TTL
  }
}

export const customSubscriptionTransport = new CustomTransport()
