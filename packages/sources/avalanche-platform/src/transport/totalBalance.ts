import { EndpointContext } from '@chainlink/external-adapter-framework/adapter'
import { calculateHttpRequestKey } from '@chainlink/external-adapter-framework/cache'
import { TransportDependencies } from '@chainlink/external-adapter-framework/transports'
import { SubscriptionTransport } from '@chainlink/external-adapter-framework/transports/abstract/subscription'
import { AdapterResponse, makeLogger, sleep } from '@chainlink/external-adapter-framework/util'
import { GroupRunner } from '@chainlink/external-adapter-framework/util/group-runner'
import { Requester } from '@chainlink/external-adapter-framework/util/requester'
import { AdapterError } from '@chainlink/external-adapter-framework/validation/error'
import { BaseEndpointTypes, inputParameters } from '../endpoint/totalBalance'

const logger = makeLogger('TotalBalanceTransport')

type RequestParams = typeof inputParameters.validated

export type GetBalanceResult = {
  balance: string
  unlocked: string
  lockedStakeable: string
  lockedNotStakeable: string
  balances: Record<string, string>
  unlockeds: Record<string, string>
  lockedStakeables: Record<string, string>
  lockedNotStakeables: Record<string, string>
  utxoIDs: {
    txID: string
    outputIndex: number
  }[]
}

export type GetStakeResult = {
  staked: string
  stakeds: Record<string, string>
  stakedOutputs: string[]
  encoding: string
}

type PlatformResponse<T> = {
  result: T
}

type BalanceResult = {
  address: string
  balance: string
  unlocked: string
  lockedStakeable: string
  lockedNotStakeable: string
  staked: string
}

const RESULT_DECIMALS = 18
const P_CHAIN_DECIMALS = 9

const scaleFactor = 10n ** BigInt(RESULT_DECIMALS - P_CHAIN_DECIMALS)
const scale = (n: string) => (BigInt(n) * scaleFactor).toString()

export class TotalBalanceTransport extends SubscriptionTransport<BaseEndpointTypes> {
  config!: BaseEndpointTypes['Settings']
  endpointName!: string
  requester!: Requester

  async initialize(
    dependencies: TransportDependencies<BaseEndpointTypes>,
    adapterSettings: BaseEndpointTypes['Settings'],
    endpointName: string,
    transportName: string,
  ): Promise<void> {
    await super.initialize(dependencies, adapterSettings, endpointName, transportName)
    this.config = adapterSettings
    this.endpointName = endpointName
    this.requester = dependencies.requester
  }

  async backgroundHandler(context: EndpointContext<BaseEndpointTypes>, entries: RequestParams[]) {
    await Promise.all(entries.map(async (param) => this.handleRequest(param)))
    await sleep(context.adapterSettings.BACKGROUND_EXECUTE_MS)
  }

  async handleRequest(param: RequestParams) {
    let response: AdapterResponse<BaseEndpointTypes['Response']>
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
  ): Promise<AdapterResponse<BaseEndpointTypes['Response']>> {
    const providerDataRequestedUnixMs = Date.now()

    const result = await this.getTotalBalances({
      addresses: params.addresses,
      assetId: params.assetId,
    })

    return {
      data: {
        result,
        decimals: RESULT_DECIMALS,
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

  async getTotalBalances({
    addresses,
    assetId,
  }: {
    addresses: { address: string }[]
    assetId: string
  }): Promise<BalanceResult[]> {
    const runner = new GroupRunner(this.config.GROUP_SIZE)
    const getBalance = runner.wrapFunction(this.getBalance.bind(this))
    const getStake = runner.wrapFunction(this.getStake.bind(this))

    return await Promise.all(
      addresses.map(async ({ address }) => {
        const [balanceResult, stakedResult] = await Promise.all([
          getBalance(address),
          getStake(address),
        ])
        const unlocked = scale(balanceResult.unlockeds[assetId] ?? '0')
        const lockedStakeable = scale(balanceResult.lockedStakeables[assetId] ?? '0')
        const lockedNotStakeable = scale(balanceResult.lockedNotStakeables[assetId] ?? '0')
        const staked = scale(stakedResult.stakeds[assetId] ?? '0')
        const balance = [unlocked, lockedStakeable, lockedNotStakeable, staked]
          .reduce((a, b) => a + BigInt(b), 0n)
          .toString()
        return {
          address,
          balance,
          unlocked,
          lockedStakeable,
          lockedNotStakeable,
          staked,
        }
      }),
    )
  }

  getBalance(address: string): Promise<GetBalanceResult> {
    return this.callPlatformMethod({
      method: 'getBalance',
      address,
    })
  }

  async getStake(address: string): Promise<GetStakeResult> {
    return this.callPlatformMethod({
      method: 'getStake',
      address,
    })
  }

  async callPlatformMethod<T>({
    method,
    address,
  }: {
    method: string
    address: string
  }): Promise<T> {
    const requestConfig = {
      method: 'POST',
      baseURL: this.config.P_CHAIN_RPC_URL,
      data: {
        jsonrpc: '2.0',
        method: `platform.${method}`,
        params: { addresses: [address] },
        id: '1',
      },
    }

    const result = await this.requester.request<PlatformResponse<T>>(
      calculateHttpRequestKey<BaseEndpointTypes>({
        context: {
          adapterSettings: this.config,
          inputParameters,
          endpointName: this.endpointName,
        },
        data: requestConfig.data,
        transportName: this.name,
      }),
      requestConfig,
    )

    return result.response.data.result
  }

  getSubscriptionTtlFromConfig(adapterSettings: BaseEndpointTypes['Settings']): number {
    return adapterSettings.WARMUP_SUBSCRIPTION_TTL
  }
}

export const totalBalanceTransport = new TotalBalanceTransport()
