import { TransportDependencies } from '@chainlink/external-adapter-framework/transports'
import { BaseEndpointTypes, inputParameters } from '../endpoint/crypto'
import { SubscriptionTransport } from '@chainlink/external-adapter-framework/transports/abstract/subscription'
import { EndpointContext } from '@chainlink/external-adapter-framework/adapter'
import { TimestampedAdapterResponse, sleep } from '@chainlink/external-adapter-framework/util'
import { BigNumber, ethers } from 'ethers'
import trumaticVaultSharesAbi from '../abi/ITrumaticVaultShares.json'

type ExchangeRateTransportTypes = BaseEndpointTypes
type RequestParams = typeof inputParameters.validated

type SharePriceResponse = [BigNumber, BigNumber]

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

    const { RPC_URL, CHAIN_ID, TRUMATIC_VAULT_SHARES_CONTRACT } = adapterSettings

    const provider = new ethers.providers.JsonRpcProvider(RPC_URL, CHAIN_ID)
    const trumaticVaultShares = new ethers.Contract(
      TRUMATIC_VAULT_SHARES_CONTRACT,
      trumaticVaultSharesAbi,
      provider,
    )

    const [numerator, denominator] = (await trumaticVaultShares.sharePrice()) as SharePriceResponse
    const price = numerator.div(denominator)

    const response: TimestampedAdapterResponse = {
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

    this.responseCache.write(this.name, [
      {
        params: param,
        response: response as TimestampedAdapterResponse<ExchangeRateTransportTypes['Response']>,
      },
    ])
  }
}

export const exchangeRateTransport = new ExchangeRateTransport()
