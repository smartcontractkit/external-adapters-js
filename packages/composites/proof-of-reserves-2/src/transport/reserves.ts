import { EndpointContext } from '@chainlink/external-adapter-framework/adapter'
import { ResponseCache } from '@chainlink/external-adapter-framework/cache/response'
import { TransportDependencies } from '@chainlink/external-adapter-framework/transports'
import { SubscriptionTransport } from '@chainlink/external-adapter-framework/transports/abstract/subscription'
import { AdapterResponse, makeLogger, sleep } from '@chainlink/external-adapter-framework/util'
import { Requester } from '@chainlink/external-adapter-framework/util/requester'
import { AdapterError } from '@chainlink/external-adapter-framework/validation/error'
import Decimal from 'decimal.js'
import objectPath from 'object-path'
import { BaseEndpointTypes, inputParameters } from '../endpoint/reserves'

const logger = makeLogger('CustomTransport')

type RequestParams = typeof inputParameters.validated

type FixedPoint = {
  amount: bigint
  decimals: number
}

type NumberType = FixedPoint | Decimal

const isFixedPoint = (num: NumberType): num is FixedPoint => {
  return 'amount' in num && 'decimals' in num
}

const toFixedPointWithDecimals = (num: NumberType, decimals: number): FixedPoint => {
  if (!isFixedPoint(num)) {
    return {
      amount: BigInt(new Decimal(num).mul(10n ** BigInt(decimals)).toFixed(0)),
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

const toDecimal = (num: NumberType): Decimal => {
  if (!isFixedPoint(num)) {
    return num
  }
  return new Decimal(num.amount.toString()).div(new Decimal(10).pow(num.decimals))
}

const add = (a: NumberType, b: NumberType): NumberType => {
  if (isFixedPoint(a) && isFixedPoint(b)) {
    let resultDecimals = Math.max(a.decimals, b.decimals)
    a = toFixedPointWithDecimals(a, resultDecimals)
    b = toFixedPointWithDecimals(b, resultDecimals)
    return {
      amount: a.amount + b.amount,
      decimals: resultDecimals,
    }
  }
  return toDecimal(a).add(toDecimal(b))
}

const multiply = (a: NumberType, b: NumberType): NumberType => {
  if (isFixedPoint(a) && isFixedPoint(b)) {
    const decimals = Math.max(a.decimals, b.decimals)
    const amount = (a.amount * b.amount) / 10n ** BigInt(a.decimals + b.decimals - decimals)
    return {
      amount,
      decimals,
    }
  }
  return toDecimal(a).mul(toDecimal(b))
}

const divide = (a: NumberType, b: NumberType): NumberType => {
  if (isFixedPoint(a) && isFixedPoint(b)) {
    const decimals = Math.max(a.decimals, b.decimals)
    const amount = (a.amount * 10n ** BigInt(decimals + b.decimals - a.decimals)) / b.amount
    return {
      amount,
      decimals,
    }
  }
  return toDecimal(a).div(toDecimal(b))
}

const getNumberFromResult = ({
  result,
  amountPath,
  decimalsPath,
}: {
  result: object
  amountPath: string
  decimalsPath: string | undefined
}): NumberType => {
  const amount: number | string = objectPath.get(result, amountPath)
  if (decimalsPath) {
    const decimals: number | string = objectPath.get(result, decimalsPath)
    return {
      amount: BigInt(amount),
      decimals: Number(decimals),
    }
  }
  return new Decimal(amount)
}

type ComponentParam = RequestParams['components'][number]
type ConversionParam = RequestParams['conversions'][number]

type ProcessedComponent = {
  name: string
  currency: string
  totalBalance: NumberType
}

type ProcessedConversion = {
  from: string
  to: string
  rate: NumberType
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
    await Promise.all(entries.map(async (param) => this.handleRequest(param)))
    await sleep(context.adapterSettings.BACKGROUND_EXECUTE_MS)
  }

  async handleRequest(param: RequestParams) {
    let response: AdapterResponse<CustomTransportTypes['Response']>
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
    params: RequestParams,
  ): Promise<AdapterResponse<CustomTransportTypes['Response']>> {
    const providerDataRequestedUnixMs = Date.now()

    console.log('dskloetx _handleRequest params', JSON.stringify(params, null, 2))
    const [components, conversions] = await Promise.all([
      Promise.all(params.components.map((component) => this.fetchComponent(component))),
      Promise.all(params.conversions.map((conversion) => this.fetchConversion(conversion))),
    ])

    console.log('dskloetx _handleRequest components', components)
    console.log('dskloetx _handleRequest conversions', conversions)

    /*
    const componentsForResponse = components.map((component) => ({
      name: component.name,
      originalCurrency: component.currency,
      totalBalanceInOriginalCurrency: {
        amount: component.totalBalance.amount.toString()
        decimals: compnent.totalBalance.decimals,
      },
    }))
    */

    for (const conversion of conversions) {
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

    console.log('dskloetx _handleRequest components after conversion', components)

    let totalReserves = components.reduce((acc, component) => add(acc, component.totalBalance), {
      amount: 0n,
      decimals: 0,
    } as NumberType)

    if (!isFixedPoint(totalReserves)) {
      totalReserves = toFixedPointWithDecimals(totalReserves, params.resultDecimals)
    }

    const result = totalReserves.amount.toString()
    const decimals = totalReserves.decimals

    return {
      data: {
        result,
        decimals,
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

  async fetchComponent(component: ComponentParam): Promise<ProcessedComponent> {
    let balanceProviderAddressParams = {}
    console.log('dskloetx fetchComponent 1 component', component)
    if (component.addresses !== undefined && component.balances.addressArrayPath !== undefined) {
      console.log('dskloetx fetchComponent 2 component.address', component.addresses)
      const addressResponseData = await this.fetchData({
        provider: component.addresses.provider,
        params: JSON.parse(component.addresses.params),
      })
      console.log('dskloetx fetchComponent 3 addressResponseData', addressResponseData)
      const addressArray = objectPath.get(addressResponseData, component.addresses.addressArrayPath)
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
      console.log('dskloetx fetchComponent 4 addressArray', addressArray)
      objectPath.set(
        balanceProviderAddressParams,
        component.balances.addressArrayPath,
        addressArray,
      )
      console.log(
        'dskloetx fetchComponent 5 balanceProviderAddressParams',
        balanceProviderAddressParams,
      )
    }

    const balanceProviderParams = {
      ...JSON.parse(component.balances.params),
      ...balanceProviderAddressParams,
    }
    console.log('dskloetx fetchComponent 6 balanceProviderParams', balanceProviderParams)

    const responseData = await this.fetchData({
      provider: component.balances.provider,
      params: balanceProviderParams,
    })
    console.log('dskloet _fetchComponent 4 responseData', responseData)
    const array: object[] =
      component.reduce.arrayPath !== undefined
        ? objectPath.get(responseData, component.reduce.arrayPath)
        : [responseData]
    console.log('dskloet _fetchComponent 5 array', array)
    const balances: NumberType[] = array.map((item) => {
      return getNumberFromResult({
        result: item,
        amountPath: component.reduce.balancePath,
        decimalsPath: component.reduce.decimalsPath,
      })
    })
    console.log('dskloet _fetchComponent 6 balances', balances)

    return {
      name: component.name,
      currency: component.currency,
      totalBalance: balances.reduce((acc, balance) => add(acc, balance), {
        amount: 0n,
        decimals: 0,
      }),
    }
  }

  async fetchData({ provider, params }: { provider: string; params: object }): Promise<object> {
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
      const result = await this.requester.request(JSON.stringify(requestConfig), requestConfig)
      return result.response.data as object
    } catch (error: unknown) {
      throw new AdapterError({
        statusCode: 502,
        message: `Error fetching data from provider ${provider} at '${url}': ${
          error instanceof Error ? error.message : String(error)
        }`,
      })
    }
  }

  async fetchConversion(conversion: ConversionParam): Promise<ProcessedConversion> {
    const responseData = await this.fetchData({
      provider: conversion.provider,
      params: JSON.parse(conversion.params),
    })
    const rate = getNumberFromResult({
      result: responseData,
      amountPath: conversion.ratePath,
      decimalsPath: conversion.decimalsPath,
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
