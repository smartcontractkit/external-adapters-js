import { EndpointContext } from '@chainlink/external-adapter-framework/adapter'
import { TransportDependencies } from '@chainlink/external-adapter-framework/transports'
import { SubscriptionTransport } from '@chainlink/external-adapter-framework/transports/abstract/subscription'
import { AdapterResponse, makeLogger, sleep } from '@chainlink/external-adapter-framework/util'
import { AdapterInputError } from '@chainlink/external-adapter-framework/validation/error'
import { BorshAccountsCoder, Idl } from '@coral-xyz/anchor'
import { type Address } from '@solana/addresses'
import { getUtf8Encoder } from '@solana/codecs-strings'
import { type Rpc, type SolanaRpcApi } from '@solana/rpc'
import { BaseEndpointTypes, inputParameters } from '../endpoint/anchor-data'
import * as fragmetricLiquidRestakingProgramIdl from '../idl/fragmetric_liquid_restaking.json'
import { SolanaRpcFactory } from '../shared/solana-rpc-factory'

const logger = makeLogger('AnchorDataTransport')

const programToIdlMap: Record<string, Idl> = {
  fragnAis7Bp6FTsMoa6YcH8UffhEw43Ph79qAiK3iF3: fragmetricLiquidRestakingProgramIdl as Idl,
}

type RequestParams = typeof inputParameters.validated

export class AnchorDataTransport extends SubscriptionTransport<BaseEndpointTypes> {
  utfEncoder!: ReturnType<typeof getUtf8Encoder>
  rpc!: Rpc<SolanaRpcApi>

  async initialize(
    dependencies: TransportDependencies<BaseEndpointTypes>,
    adapterSettings: BaseEndpointTypes['Settings'],
    endpointName: string,
    transportName: string,
  ): Promise<void> {
    await super.initialize(dependencies, adapterSettings, endpointName, transportName)
    this.rpc = new SolanaRpcFactory().create(adapterSettings.RPC_URL)
    this.utfEncoder = getUtf8Encoder()
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

    const encoding = 'base64'

    const resp = await this.rpc
      .getAccountInfo(params.stateAccountAddress as Address, { encoding })
      .send()
    const programAddress = resp.value?.owner
    if (!programAddress) {
      throw new AdapterInputError({
        message: `No program address found for state account '${params.stateAccountAddress}'`,
        statusCode: 500,
      })
    }

    const idl = programToIdlMap[programAddress.toString()]

    if (!idl) {
      throw new AdapterInputError({
        message: `No IDL known for program address '${programAddress}'`,
        statusCode: 500,
      })
    }

    const data = Buffer.from(resp.value.data[0] as string, encoding)
    const coder = new BorshAccountsCoder(idl as unknown as Idl)
    const dataDecoded = coder.decode(params.account, data)
    const result = dataDecoded[params.field].toString()

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

  getSubscriptionTtlFromConfig(adapterSettings: BaseEndpointTypes['Settings']): number {
    return adapterSettings.WARMUP_SUBSCRIPTION_TTL
  }
}

export const anchorDataTransport = new AnchorDataTransport()
