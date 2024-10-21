import { TransportDependencies } from '@chainlink/external-adapter-framework/transports'
import { AdapterResponse, makeLogger, sleep } from '@chainlink/external-adapter-framework/util'
import { SubscriptionTransport } from '@chainlink/external-adapter-framework/transports/abstract/subscription'
import { EndpointContext } from '@chainlink/external-adapter-framework/adapter'
import { Requester } from '@chainlink/external-adapter-framework/util/requester'
import { ethers } from 'ethers'
import { BaseEndpointTypes, inputParameters } from '../endpoint/proof-of-reserves'
import abi from '../config/dlc-manager-abi.json'
import {
  BitcoinTransaction,
  createTaprootMultisigPayment,
  getBitcoinNetwork,
  getDerivedPublicKey,
  getScriptMatchingOutputFromTransaction,
  getUnspendableKeyCommittedToUUID,
  RawVault,
} from './utils'
import { AdapterError } from '@chainlink/external-adapter-framework/validation/error'

const logger = makeLogger('dlcBTC PoR')

type RequestParams = typeof inputParameters.validated

export type TransportTypes = BaseEndpointTypes

export class DLCBTCPorTransport extends SubscriptionTransport<TransportTypes> {
  name!: string
  requester!: Requester
  settings!: TransportTypes['Settings']
  providers: Record<string, ethers.providers.JsonRpcProvider> = {}
  dlcManagerContracts: Record<string, ethers.Contract> = {}

  async initialize(
    dependencies: TransportDependencies<TransportTypes>,
    adapterSettings: TransportTypes['Settings'],
    endpointName: string,
    transportName: string,
  ): Promise<void> {
    await super.initialize(dependencies, adapterSettings, endpointName, transportName)
    this.settings = adapterSettings
    this.requester = dependencies.requester
  }

  async backgroundHandler(context: EndpointContext<TransportTypes>, entries: RequestParams[]) {
    await Promise.all(entries.map(async (param) => this.handleRequest(param)))
    await sleep(context.adapterSettings.BACKGROUND_EXECUTE_MS)
  }

  async handleRequest(param: RequestParams) {
    let response: AdapterResponse<TransportTypes['Response']>
    try {
      response = await this._handleRequest(param)
    } catch (e) {
      const errorMessage = e instanceof Error ? e.message : 'Unknown error occurred'
      logger.error(e, errorMessage)
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
    await this.responseCache.write(this.name, [{ params: param, response }])
  }

  async _handleRequest(param: RequestParams): Promise<AdapterResponse<TransportTypes['Response']>> {
    const { network, dlcContract: dlcContractAddress } = param

    const networkName = network.toUpperCase()
    // ${networkName}_RPC_URL and ${networkName}_CHAIN_ID are already validated in customInputValidation
    const rpcUrl = process.env[`${networkName}_RPC_URL`] as string
    const chainId = Number(process.env[`${networkName}_CHAIN_ID`])

    if (!this.providers[networkName]) {
      this.providers[networkName] = new ethers.providers.JsonRpcProvider(rpcUrl, chainId)
      this.dlcManagerContracts[networkName] = new ethers.Contract(
        dlcContractAddress,
        abi,
        this.providers[networkName],
      )
    }

    const providerDataRequestedUnixMs = Date.now()

    // Get funded vault data.
    const vaultData: RawVault[] = await this.getAllFundedDLCs(networkName)

    // Get the Attestor Public Key from the Attestor Group
    const attestorPublicKey = getDerivedPublicKey(
      await this.dlcManagerContracts[networkName].attestorGroupPubKey(),
      getBitcoinNetwork(this.settings.BITCOIN_NETWORK),
    )

    let totalPoR = 0
    const concurrencyGroupSize = this.settings.BITCOIN_RPC_GROUP_SIZE || vaultData.length
    // Process vault batches sequentially to not overload the BITCOIN_RPC server
    for (let i = 0; i < vaultData.length; i += concurrencyGroupSize) {
      let group = []
      if (this.settings.BITCOIN_RPC_GROUP_SIZE > 0) {
        group = vaultData.slice(i, i + concurrencyGroupSize)
      } else {
        group = vaultData
      }
      const deposits = await Promise.all(
        group.map(async (vault) => {
          return await this.verifyVaultDeposit(vault, attestorPublicKey)
        }),
      )
      // totalPoR represents total proof of reserves value in bitcoins
      totalPoR += deposits.reduce((sum, deposit) => sum + deposit, 0)
    }

    // multiply by 10^8 to convert to satoshis
    const result = totalPoR * 10 ** 8

    return {
      data: {
        result: result,
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

  async getAllFundedDLCs(networkName: string): Promise<RawVault[]> {
    const allVaults: RawVault[] = []
    for (let totalFetched = 0; ; totalFetched += this.settings.EVM_RPC_BATCH_SIZE) {
      const fetchedVaults: RawVault[] = await this.dlcManagerContracts[networkName].getAllDLCs(
        totalFetched,
        totalFetched + this.settings.EVM_RPC_BATCH_SIZE,
      )
      allVaults.push(...fetchedVaults)

      if (fetchedVaults.length !== this.settings.EVM_RPC_BATCH_SIZE) {
        break
      }
    }
    return allVaults
  }

  async verifyVaultDeposit(vault: RawVault, attestorPublicKey: Buffer) {
    if (!vault.taprootPubKey || !vault.valueLocked || !vault.uuid) {
      return 0
    }
    const txID = vault.wdTxId ? vault.wdTxId : vault.fundingTxId

    if (!txID) {
      return 0
    }

    // Get the bitcoin transaction
    const fundingTransaction = await this.fetchFundingTransaction(txID)

    if (!fundingTransaction) {
      throw new Error(`Funding transaction not found for vault ${vault.uuid}`)
    }

    // Check and filter transactions that have less than [settings.CONFIRMATIONS] confirmations
    if (fundingTransaction.confirmations < this.settings.CONFIRMATIONS) {
      return 0
    }

    // Get the Bitcoin network object
    const bitcoinNetwork = getBitcoinNetwork(this.settings.BITCOIN_NETWORK)

    const unspendableKeyCommittedToUUID = getDerivedPublicKey(
      getUnspendableKeyCommittedToUUID(vault.uuid, bitcoinNetwork),
      bitcoinNetwork,
    )

    const multisigTransaction = createTaprootMultisigPayment(
      unspendableKeyCommittedToUUID,
      attestorPublicKey,
      Buffer.from(vault.taprootPubKey, 'hex'),
      bitcoinNetwork,
    )

    const vaultTransactionOutput = getScriptMatchingOutputFromTransaction(
      fundingTransaction,
      multisigTransaction.script,
    )

    if (!vaultTransactionOutput) {
      return 0
    }

    return vaultTransactionOutput.value
  }

  async fetchFundingTransaction(txId: string): Promise<BitcoinTransaction> {
    const requestConfig = {
      baseURL: this.settings.BITCOIN_RPC_URL,
      method: 'POST',
      data: {
        id: 'dlc-btc-por-ea',
        jsonrpc: '2.0',
        method: 'getrawtransaction',
        params: [txId, true, null],
      },
    }
    const { response } = await this.requester.request<{ result: BitcoinTransaction }>(
      txId,
      requestConfig,
    )

    const result = response.data.result

    if (!result) {
      logger.error('BITCOIN_RPC_URL - getrawtransaction failed, txId: ', txId)
      logger.error('BITCOIN_RPC_URL - getrawtransaction failed, response: ', response)
    }

    return result
  }

  getSubscriptionTtlFromConfig(adapterSettings: TransportTypes['Settings']): number {
    return adapterSettings.WARMUP_SUBSCRIPTION_TTL
  }
}

export const porTransport = new DLCBTCPorTransport()
