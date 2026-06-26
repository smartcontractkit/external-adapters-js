import { EndpointContext } from '@chainlink/external-adapter-framework/adapter'
import { TransportDependencies } from '@chainlink/external-adapter-framework/transports'
import { SubscriptionTransport } from '@chainlink/external-adapter-framework/transports/abstract/subscription'
import { AdapterResponse, makeLogger, sleep } from '@chainlink/external-adapter-framework/util'
import { AdapterInputError } from '@chainlink/external-adapter-framework/validation/error'
import { type Rpc, type SolanaRpcApi } from '@solana/rpc'
import { BaseEndpointTypes, inputParameters } from '../endpoint/strcusx-exchange-rate'
import { assertTokenProgramOwner, decodeMintInfo } from '../shared/buffer-layout-accounts'
import {
  applyRateBounds,
  calculateNormalizedRate,
  parseRateBounds,
  RESULT_DECIMALS,
} from '../shared/exchange-rate-utils'
import {
  assertOwnerProgram,
  CLOCK_SYSVAR_ADDRESS,
  decodeClockUnixTimestamp,
  fetchMultipleAccounts,
  getAccountDataBuffer,
  parseSolanaAddress,
  providerError,
} from '../shared/solana-account-utils'
import { SolanaRpcFactory } from '../shared/solana-rpc-factory'
import {
  calculateBookValueAssets,
  decodeAccountingState,
  decodeControllerState,
  decodeStrategyState,
  deriveAccountAddress,
  parseStrategyName,
  PDA_SEEDS,
  type Tranche,
} from './strcusx-accounts'

const logger = makeLogger('StrcusxExchangeRateTransport')

type RequestParams = typeof inputParameters.validated

export class StrcusxExchangeRateTransport extends SubscriptionTransport<BaseEndpointTypes> {
  rpc!: Rpc<SolanaRpcApi>

  async initialize(
    dependencies: TransportDependencies<BaseEndpointTypes>,
    adapterSettings: BaseEndpointTypes['Settings'],
    endpointName: string,
    transportName: string,
  ): Promise<void> {
    await super.initialize(dependencies, adapterSettings, endpointName, transportName)
    this.rpc = new SolanaRpcFactory().create(adapterSettings.RPC_URL)
  }

  async backgroundHandler(context: EndpointContext<BaseEndpointTypes>, entries: RequestParams[]) {
    await Promise.all(entries.map(async (param) => this.handleRequest(param)))
    await sleep(context.adapterSettings.BACKGROUND_EXECUTE_MS)
  }

  async handleRequest(param: RequestParams) {
    let response: AdapterResponse<BaseEndpointTypes['Response']>
    try {
      response = await this._handleRequest(param)
    } catch (e: unknown) {
      const errorMessage = e instanceof Error ? e.message : 'Unknown error occurred'
      logger.error(e, errorMessage)
      response = {
        statusCode: (e as AdapterInputError)?.statusCode || 502,
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
    const programAddress = parseSolanaAddress(params.programAddress, 'programAddress').toString()
    const strategyName = parseStrategyName(params.strategyName)
    const tranche = params.tranche as Tranche
    const { minRate, maxRate } = parseRateBounds(params.minRate, params.maxRate)

    const [controllerAddress, strategyAddress, accountingAddress] = await Promise.all([
      deriveAccountAddress(programAddress, [PDA_SEEDS.CONTROLLER]),
      deriveAccountAddress(programAddress, [PDA_SEEDS.STRATEGY, strategyName]),
      deriveAccountAddress(programAddress, [PDA_SEEDS.ACCOUNTING, strategyName]),
    ])

    const [controllerAccount, strategyAccount, accountingAccount, clockAccount] =
      await fetchMultipleAccounts(this.rpc, [
        controllerAddress,
        strategyAddress,
        accountingAddress,
        CLOCK_SYSVAR_ADDRESS,
      ])

    assertOwnerProgram(
      controllerAccount,
      `Controller account '${controllerAddress}'`,
      [programAddress],
      'the requested yield strategy program',
    )
    assertOwnerProgram(
      strategyAccount,
      `Strategy account '${strategyAddress}'`,
      [programAddress],
      'the requested yield strategy program',
    )
    assertOwnerProgram(
      accountingAccount,
      `Accounting account '${accountingAddress}'`,
      [programAddress],
      'the requested yield strategy program',
    )

    const controller = decodeControllerState(
      getAccountDataBuffer(controllerAccount, `Controller account '${controllerAddress}'`),
    )
    const strategy = decodeStrategyState(
      getAccountDataBuffer(strategyAccount, `Strategy account '${strategyAddress}'`),
    )
    const accounting = decodeAccountingState(
      getAccountDataBuffer(accountingAccount, `Accounting account '${accountingAddress}'`),
    )

    const trancheMintAddress =
      tranche === 'junior' ? strategy.juniorMintAddress : strategy.seniorMintAddress
    const [assetMintAccount, trancheMintAccount] = await fetchMultipleAccounts(this.rpc, [
      controller.assetMintAddress,
      trancheMintAddress,
    ])

    assertTokenProgramOwner(assetMintAccount, `asset mint '${controller.assetMintAddress}'`)
    assertTokenProgramOwner(trancheMintAccount, `${tranche} mint '${trancheMintAddress}'`)

    const assetMint = decodeMintInfo(
      getAccountDataBuffer(assetMintAccount, `asset mint '${controller.assetMintAddress}'`),
      `asset mint '${controller.assetMintAddress}'`,
    )
    const trancheMint = decodeMintInfo(
      getAccountDataBuffer(trancheMintAccount, `${tranche} mint '${trancheMintAddress}'`),
      `${tranche} mint '${trancheMintAddress}'`,
    )

    const clockUnixTimestamp = decodeClockUnixTimestamp(clockAccount)
    const bookValueAssets = calculateBookValueAssets(accounting, clockUnixTimestamp)

    if (bookValueAssets.totalAssets < bookValueAssets.seniorAssets) {
      throw providerError(
        `AccountingState vested totalAssets must be greater than or equal to vested seniorAssets`,
      )
    }

    const juniorAssets = bookValueAssets.totalAssets - bookValueAssets.seniorAssets
    const trancheAssets = tranche === 'junior' ? juniorAssets : bookValueAssets.seniorAssets
    const trancheShares = tranche === 'junior' ? accounting.juniorShares : accounting.seniorShares
    const selectedComputedRate = calculateNormalizedRate(
      trancheAssets,
      trancheShares,
      assetMint.decimals,
      trancheMint.decimals,
    )

    if (selectedComputedRate === null) {
      throw providerError(`${tranche} tranche shares are zero`)
    }

    const { rate, boundsApplied } = applyRateBounds(selectedComputedRate, minRate, maxRate)
    const result = rate.toString()
    const computedResult = selectedComputedRate.toString()

    return {
      data: {
        result,
        computedResult,
        tranche,
        decimals: RESULT_DECIMALS,
        boundsApplied,
        trancheAssets: trancheAssets.toString(),
        trancheShares: trancheShares.toString(),
      },
      statusCode: 200,
      result,
      timestamps: {
        providerDataRequestedUnixMs,
        providerDataReceivedUnixMs: Date.now(),
        providerIndicatedTimeUnixMs: Number(clockUnixTimestamp * 1000n),
      },
    }
  }

  getSubscriptionTtlFromConfig(adapterSettings: BaseEndpointTypes['Settings']): number {
    return adapterSettings.WARMUP_SUBSCRIPTION_TTL
  }
}

export const strcusxExchangeRateTransport = new StrcusxExchangeRateTransport()
