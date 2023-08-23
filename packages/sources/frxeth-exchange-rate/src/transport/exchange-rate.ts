import { TransportDependencies } from '@chainlink/external-adapter-framework/transports'
import { SubscriptionTransport } from '@chainlink/external-adapter-framework/transports/abstract/subscription'
import { BigNumber, ethers } from 'ethers'
import { EndpointContext } from '@chainlink/external-adapter-framework/adapter'
import { BaseEndpointTypes, inputParameters } from '../endpoint/crypto'
import fraxEthDualOracleAbi from '../abi/IFraxEthDualOracle.json'
import { TimestampedAdapterResponse, sleep } from '@chainlink/external-adapter-framework/util'

type ExchangeRateTransportTypes = BaseEndpointTypes
type RequestParams = typeof inputParameters.validated
type GetPricesResponse = {
  isBadData: boolean
  priceLow: BigNumber
  priceHigh: BigNumber
}

class ExchangeRateTransport extends SubscriptionTransport<ExchangeRateTransportTypes> {
  async initialize(
    dependencies: TransportDependencies<ExchangeRateTransportTypes>,
    adapterSettings: ExchangeRateTransportTypes['Settings'],
    endpointName: string,
    transportName: string,
  ): Promise<void> {
    await super.initialize(dependencies, adapterSettings, endpointName, transportName)
  }

  getSubscriptionTtlFromConfig(adapterSettings: ExchangeRateTransportTypes['Settings']): number {
    return adapterSettings.WARMUP_SUBSCRIPTION_TTL
  }

  async backgroundHandler(
    context: EndpointContext<ExchangeRateTransportTypes>,
    entries: RequestParams[],
  ) {
    await Promise.all(
      entries.map(async (param) => await this.handleRequest(context.adapterSettings, param)),
    )
    await sleep(context.adapterSettings.BACKGROUND_EXECUTE_MS)
  }

  async handleRequest(
    adapterSettings: ExchangeRateTransportTypes['Settings'],
    param: RequestParams,
  ) {
    const providerDataRequestedUnixMs = Date.now()

    const { RPC_URL, CHAIN_ID, FRAX_ETH_PRICE_CONTRACT } = adapterSettings

    const provider = new ethers.providers.JsonRpcProvider(RPC_URL, CHAIN_ID)
    const fraxEthPrice = new ethers.Contract(
      FRAX_ETH_PRICE_CONTRACT,
      fraxEthDualOracleAbi,
      provider,
    )

    const { isBadData, priceLow, priceHigh } = (await fraxEthPrice.getPrices()) as GetPricesResponse

    let response: TimestampedAdapterResponse

    if (isBadData != false) {
      response = {
        statusCode: 502,
        errorMessage: 'Contract is reporting stale or bad data for getPrices.',
        timestamps: {
          providerDataRequestedUnixMs,
          providerDataReceivedUnixMs: Date.now(),
          providerIndicatedTimeUnixMs: undefined,
        },
      }
    } else {
      const price = param.priceType.toUpperCase() == 'HIGH' ? priceHigh : priceLow
      response = {
        data: {
          result: price.toString(),
        },
        result: price.toString(),
        timestamps: {
          providerDataRequestedUnixMs,
          providerDataReceivedUnixMs: Date.now(),
          providerIndicatedTimeUnixMs: undefined,
        },
      }
    }

    this.responseCache.write(this.name, [
      {
        params: param,
        response: response as TimestampedAdapterResponse<ExchangeRateTransportTypes['Response']>,
      },
    ])
  }
}

export const exchangeRateTransport = new ExchangeRateTransport()
