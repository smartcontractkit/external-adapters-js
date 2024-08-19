import { TransportDependencies } from '@chainlink/external-adapter-framework/transports'
import {
  SingleNumberResultResponse,
  TimestampedAdapterResponse,
  sleep,
} from '@chainlink/external-adapter-framework/util'
import { SubscriptionTransport } from '@chainlink/external-adapter-framework/transports/abstract/subscription'
import { EndpointContext } from '@chainlink/external-adapter-framework/adapter'
import { BaseEndpointTypes, inputParameters } from '../endpoint/price'
import { ethers } from 'ethers'
import { getsUSDToUSD, getwstETHToUSD } from './util'
import { Decimal } from 'decimal.js'
import { AdapterError } from '@chainlink/external-adapter-framework/validation/error'

type ExchangeRateTransportTypes = BaseEndpointTypes
type RequestParams = typeof inputParameters.validated

class ExchangeRateTransport extends SubscriptionTransport<ExchangeRateTransportTypes> {
  provider!: ethers.providers.JsonRpcProvider

  async initialize(
    dependencies: TransportDependencies<ExchangeRateTransportTypes>,
    adapterSettings: ExchangeRateTransportTypes['Settings'],
    endpointName: string,
    transportName: string,
  ): Promise<void> {
    await super.initialize(dependencies, adapterSettings, endpointName, transportName)
    const { RPC_URL, CHAIN_ID } = adapterSettings
    this.provider = new ethers.providers.JsonRpcProvider(RPC_URL, CHAIN_ID)
  }

  getSubscriptionTtlFromConfig(adapterSettings: ExchangeRateTransportTypes['Settings']): number {
    return adapterSettings.WARMUP_SUBSCRIPTION_TTL
  }

  async backgroundHandler(
    context: EndpointContext<ExchangeRateTransportTypes>,
    entries: RequestParams[],
  ) {
    await Promise.all(entries.map(async (param) => this.handleRequest(param)))
    await sleep(context.adapterSettings.BACKGROUND_EXECUTE_MS)
  }

  async handleRequest(param: RequestParams) {
    let response: TimestampedAdapterResponse<SingleNumberResultResponse>
    try {
      response = await this._handleRequest(param)
    } catch (e) {
      const errorMessage = e instanceof Error ? e.message : 'Unknown error occurred'
      const statusCode = (e as AdapterError)?.statusCode || 502
      response = {
        statusCode,
        errorMessage,
        timestamps: {
          providerDataRequestedUnixMs: 0,
          providerDataReceivedUnixMs: 0,
          providerIndicatedTimeUnixMs: undefined,
        },
      }
    }

    this.responseCache.write(this.name, [
      {
        params: param,
        response: response,
      },
    ])
  }

  async _handleRequest(param: RequestParams) {
    const providerDataRequestedUnixMs = Date.now()

    if (param.base === 'sUSDe') {
      const price = await getsUSDToUSD(param.base_address, param.quote_address, this.provider)
      return buildResponse(price, providerDataRequestedUnixMs)
    } else if (param.base === 'wstETH') {
      const price = await getwstETHToUSD(param.base_address, param.quote_address, this.provider)
      return buildResponse(price, providerDataRequestedUnixMs)
    } else {
      throw new AdapterError({
        statusCode: 400,
        message: `${param.base} is not a valid base`,
      })
    }
  }
}

const buildResponse = (price: Decimal, providerDataRequestedUnixMs: number) => {
  return {
    data: {
      result: price.toNumber(),
    },
    result: price.toNumber(),
    timestamps: {
      providerDataRequestedUnixMs,
      providerDataReceivedUnixMs: Date.now(),
      providerIndicatedTimeUnixMs: undefined,
    },
  }
}

export const exchangeRateTransport = new ExchangeRateTransport()
