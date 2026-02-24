import { EndpointContext } from '@chainlink/external-adapter-framework/adapter'
import { TransportDependencies } from '@chainlink/external-adapter-framework/transports'
import { SubscriptionTransport } from '@chainlink/external-adapter-framework/transports/abstract/subscription'
import { AdapterResponse, makeLogger, sleep } from '@chainlink/external-adapter-framework/util'
import { ethers } from 'ethers'
import { BaseEndpointTypes } from '../endpoint/round'

const logger = makeLogger('XUSD USD Exchange Rate')

const XUSD_CONTRACT_ADDRESS = '0xE2Fc85BfB48C4cF147921fBE110cf92Ef9f26F94'
const ROUND_FUNCTION_SELECTOR = '0x146ca531'

export type RoundTransportTypes = BaseEndpointTypes

export function hexToDecimalString(resultHex: string): string {
  return BigInt(resultHex).toString()
}

export class RoundTransport extends SubscriptionTransport<RoundTransportTypes> {
  provider!: ethers.JsonRpcProvider

  async initialize(
    dependencies: TransportDependencies<RoundTransportTypes>,
    adapterSettings: RoundTransportTypes['Settings'],
    endpointName: string,
    transportName: string,
  ): Promise<void> {
    await super.initialize(dependencies, adapterSettings, endpointName, transportName)
    this.provider = new ethers.JsonRpcProvider(
      adapterSettings.ETHEREUM_RPC_URL,
      adapterSettings.ETHEREUM_CHAIN_ID,
    )
  }

  async backgroundHandler(
    context: EndpointContext<RoundTransportTypes>,
    _entries: RoundTransportTypes['Parameters'][],
  ): Promise<void> {
    await this.handleRequest()
    await sleep(context.adapterSettings.BACKGROUND_EXECUTE_MS)
  }

  async handleRequest(): Promise<void> {
    let response: AdapterResponse<RoundTransportTypes['Response']>
    try {
      response = await this._handleRequest()
    } catch (e) {
      logger.error(e)
      const errorMessage = e instanceof Error ? e.message : 'Unknown error occurred'
      response = {
        statusCode: 502,
        errorMessage,
        timestamps: {
          providerDataRequestedUnixMs: 0,
          providerDataReceivedUnixMs: 0,
          providerIndicatedTimeUnixMs: undefined,
        },
      }
    }
    await this.responseCache.write(this.name, [{ params: {}, response }])
  }

  async _handleRequest(): Promise<AdapterResponse<RoundTransportTypes['Response']>> {
    const providerDataRequestedUnixMs = Date.now()

    const resultHex = await this.provider.call({
      to: XUSD_CONTRACT_ADDRESS,
      data: ROUND_FUNCTION_SELECTOR,
    })

    const result = hexToDecimalString(resultHex)

    return {
      data: {
        result,
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

  getSubscriptionTtlFromConfig(adapterSettings: RoundTransportTypes['Settings']): number {
    return adapterSettings.WARMUP_SUBSCRIPTION_TTL
  }
}

export const roundTransport = new RoundTransport()
