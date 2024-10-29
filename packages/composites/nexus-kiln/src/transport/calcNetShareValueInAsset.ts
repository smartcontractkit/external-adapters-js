import { TransportDependencies } from '@chainlink/external-adapter-framework/transports'
import { ResponseCache } from '@chainlink/external-adapter-framework/cache/response'
import { Requester } from '@chainlink/external-adapter-framework/util/requester'
import { AdapterResponse, sleep, makeLogger } from '@chainlink/external-adapter-framework/util'
import { SubscriptionTransport } from '@chainlink/external-adapter-framework/transports/abstract/subscription'
import { EndpointContext } from '@chainlink/external-adapter-framework/adapter'
import { BaseEndpointTypes, inputParameters } from '../endpoint/calcNetShareValueInAsset'
import { AdapterError } from '@chainlink/external-adapter-framework/validation/error'
import { getEnzymeVaultBalance } from './nexus'
import { getKilnStakingYields } from './kiln'
import { ethers } from 'ethers'

const logger = makeLogger('NexusKilnTransport')

export type NexusKilnTransportTypes = BaseEndpointTypes

type RequestParams = typeof inputParameters.validated

export class NexusKilnTransport extends SubscriptionTransport<NexusKilnTransportTypes> {
  name!: string
  responseCache!: ResponseCache<NexusKilnTransportTypes>
  requester!: Requester
  provider!: ethers.JsonRpcProvider
  kilnValidatorAddressesUrl!: string
  ethBalanceAdapterUrl!: string

  async initialize(
    dependencies: TransportDependencies<NexusKilnTransportTypes>,
    adapterSettings: NexusKilnTransportTypes['Settings'],
    endpointName: string,
    transportName: string,
  ): Promise<void> {
    await super.initialize(dependencies, adapterSettings, endpointName, transportName)
    this.requester = dependencies.requester
    this.kilnValidatorAddressesUrl = adapterSettings.KILN_VALIDATOR_ADDRESSES_URL
    this.ethBalanceAdapterUrl = adapterSettings.ETH_BALANCE_ADAPTER_URL
    this.provider = new ethers.JsonRpcProvider(
      adapterSettings.ETHEREUM_RPC_URL,
      adapterSettings.ETHEREUM_CHAIN_ID,
    )
  }

  async backgroundHandler(
    context: EndpointContext<NexusKilnTransportTypes>,
    entries: RequestParams[],
  ) {
    await Promise.all(entries.map(async (param) => this.handleRequest(param)))
    await sleep(context.adapterSettings.BACKGROUND_EXECUTE_MS)
  }

  async handleRequest(param: RequestParams) {
    let response: AdapterResponse<NexusKilnTransportTypes['Response']>
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
    await this.responseCache.write(this.name, [
      {
        params: param,
        response: response,
      },
    ])
  }

  async _handleRequest(
    param: RequestParams,
  ): Promise<AdapterResponse<NexusKilnTransportTypes['Response']>> {
    const providerDataRequestedUnixMs = Date.now()

    const [enzymeVaultBalance, kilnStakingYields] = await Promise.all([
      getEnzymeVaultBalance(
        this.provider,
        param.calculatorContract,
        param.quoteAsset,
        param.nexusVaultContract,
      ),
      getKilnStakingYields(
        param.nexusVaultContract,
        param.kilnStakingContract,
        param.minConfirmations,
        this.kilnValidatorAddressesUrl,
        this.ethBalanceAdapterUrl,
        this.requester,
        this.provider,
      ),
    ])

    const result = (enzymeVaultBalance + kilnStakingYields).toString()

    return {
      data: {
        result: result,
        wETH: enzymeVaultBalance.toString(),
        unclaimedKilnFees: kilnStakingYields.toString(),
      },
      statusCode: 200,
      result: result,
      timestamps: {
        providerDataRequestedUnixMs,
        providerDataReceivedUnixMs: Date.now(),
        providerIndicatedTimeUnixMs: undefined,
      },
    }
  }

  getSubscriptionTtlFromConfig(adapterSettings: NexusKilnTransportTypes['Settings']): number {
    return adapterSettings.WARMUP_SUBSCRIPTION_TTL
  }
}

export const nexusKilnTransport = new NexusKilnTransport()
