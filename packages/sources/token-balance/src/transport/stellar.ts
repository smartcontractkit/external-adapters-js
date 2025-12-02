import { EndpointContext } from '@chainlink/external-adapter-framework/adapter'
import { calculateHttpRequestKey } from '@chainlink/external-adapter-framework/cache'
import { TransportDependencies } from '@chainlink/external-adapter-framework/transports'
import { SubscriptionTransport } from '@chainlink/external-adapter-framework/transports/abstract/subscription'
import { AdapterResponse, makeLogger, sleep } from '@chainlink/external-adapter-framework/util'
import { Requester } from '@chainlink/external-adapter-framework/util/requester'
import { AdapterInputError } from '@chainlink/external-adapter-framework/validation/error'
import { StrKey, xdr } from '@stellar/stellar-sdk'
import { AddressWithBalance, BaseEndpointTypes, inputParameters } from '../endpoint/stellar'

const logger = makeLogger('Token Balance - Stellar')

type RequestParams = typeof inputParameters.validated

const RESULT_DECIMALS = 7

type GetLedgerEntriesResponse = {
  jsonrpc: string
  id: number
  result: {
    entries: {
      key: string
      xdr: string
      lastModifiedLedgerSeq: number
      extXdr: string
    }[]
  }
}

export class StellarTransport extends SubscriptionTransport<BaseEndpointTypes> {
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
    await Promise.all(entries.map(async (param) => this.handleRequest(context, param)))
    await sleep(context.adapterSettings.BACKGROUND_EXECUTE_MS)
  }

  async handleRequest(_context: EndpointContext<BaseEndpointTypes>, param: RequestParams) {
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
    param: RequestParams,
  ): Promise<AdapterResponse<BaseEndpointTypes['Response']>> {
    const providerDataRequestedUnixMs = Date.now()
    const result = await this.getTokenBalances(param.addresses)

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

  async getTokenBalances(
    addresses: {
      address: string
    }[],
  ): Promise<AddressWithBalance[]> {
    const keys = addresses.map((a) => this.getAddressKey(a.address))

    const requestConfig = {
      method: 'POST',
      baseURL: this.config.STELLAR_RPC_URL,
      data: {
        jsonrpc: '2.0',
        id: 1,
        method: 'getLedgerEntries',
        params: {
          keys,
        },
      },
    }

    const result = await this.requester.request<GetLedgerEntriesResponse>(
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

    return result.response.data.result.entries.map((entry, index) => {
      const entryXdrB64 = entry.xdr
      const data = xdr.LedgerEntryData.fromXDR(entryXdrB64, 'base64')
      const stroops = data.account().balance().toString()
      return {
        address: addresses[index].address,
        balance: stroops,
      }
    })
  }

  getAddressKey(address: string): string {
    const rawPublicKey = StrKey.decodeEd25519PublicKey(address)
    const xdrPublicKey = xdr.PublicKey.publicKeyTypeEd25519(rawPublicKey)
    const ledgerKeyAccount = new xdr.LedgerKeyAccount({ accountId: xdrPublicKey })
    const ledgerKey = xdr.LedgerKey.account(ledgerKeyAccount)
    return ledgerKey.toXDR('base64')
  }

  getSubscriptionTtlFromConfig(adapterSettings: BaseEndpointTypes['Settings']): number {
    return adapterSettings.WARMUP_SUBSCRIPTION_TTL
  }
}

export const stellarTransport = new StellarTransport()
