import { TransportDependencies } from '@chainlink/external-adapter-framework/transports'
import { ResponseCache } from '@chainlink/external-adapter-framework/cache/response'
import { AdapterResponse, makeLogger, sleep } from '@chainlink/external-adapter-framework/util'
import { SubscriptionTransport } from '@chainlink/external-adapter-framework/transports/abstract/subscription'
import { EndpointContext } from '@chainlink/external-adapter-framework/adapter'
import { BaseEndpointTypes } from '../endpoint/vaults'
import { BigNumber, ethers } from 'ethers'
import abi from '../config/dlc-manager-abi.json'

const logger = makeLogger('dlcBTC vault data')

export type TransportTypes = BaseEndpointTypes

export interface RawVault {
  uuid: string
  protocolContract: string
  timestamp: BigNumber
  valueLocked: BigNumber
  creator: string
  status: number
  fundingTxId: string
  closingTxId: string
  btcFeeRecipient: string
  btcMintFeeBasisPoints: BigNumber
  btcRedeemFeeBasisPoints: BigNumber
  taprootPubKey: string
}

export class FundedDLCsTransport extends SubscriptionTransport<TransportTypes> {
  name!: string
  responseCache!: ResponseCache<TransportTypes>
  provider!: ethers.providers.JsonRpcProvider
  dlcManagerContract!: ethers.Contract

  async initialize(
    dependencies: TransportDependencies<TransportTypes>,
    adapterSettings: TransportTypes['Settings'],
    endpointName: string,
    transportName: string,
  ): Promise<void> {
    await super.initialize(dependencies, adapterSettings, endpointName, transportName)
    const { RPC_URL, CHAIN_ID, DLC_CONTRACT } = adapterSettings
    this.provider = new ethers.providers.JsonRpcProvider(RPC_URL, CHAIN_ID)
    this.dlcManagerContract = new ethers.Contract(DLC_CONTRACT, abi, this.provider)
  }
  async backgroundHandler(context: EndpointContext<TransportTypes>) {
    await this.handleRequest()
    await sleep(context.adapterSettings.BACKGROUND_EXECUTE_MS)
  }

  async handleRequest() {
    let response: AdapterResponse<TransportTypes['Response']>
    try {
      response = await this._handleRequest()
    } catch (e) {
      const errorMessage = e instanceof Error ? e.message : 'Unknown error occurred'
      logger.error(e, errorMessage)
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
    await this.responseCache.write(this.name, [{ params: [], response }])
  }

  async _handleRequest(): Promise<AdapterResponse<TransportTypes['Response']>> {
    const providerDataRequestedUnixMs = Date.now()

    // Get all vault data. Filter out to get rid of placeholder values. Map to return only properties that we are interested
    const vaultData = (await this.dlcManagerContract.getFundedDLCs(0, 10_000))
      .filter(
        (v: RawVault) =>
          v.uuid != '0x0000000000000000000000000000000000000000000000000000000000000000',
      )
      .map((v: RawVault) => {
        return {
          uuid: v.uuid,
          valueLocked: v.valueLocked.toNumber(),
          fundingTxId: v.fundingTxId,
          taprootPubKey: v.taprootPubKey,
        }
      })

    return {
      data: {
        vaults: vaultData,
      },
      statusCode: 200,
      result: null,
      timestamps: {
        providerDataRequestedUnixMs,
        providerDataReceivedUnixMs: Date.now(),
        providerIndicatedTimeUnixMs: undefined,
      },
    }
  }

  getSubscriptionTtlFromConfig(adapterSettings: TransportTypes['Settings']): number {
    return adapterSettings.WARMUP_SUBSCRIPTION_TTL
  }
}

export const vaultTransport = new FundedDLCsTransport()
