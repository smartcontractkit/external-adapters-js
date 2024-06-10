import { TransportDependencies } from '@chainlink/external-adapter-framework/transports'
import { AdapterResponse, makeLogger, sleep } from '@chainlink/external-adapter-framework/util'
import { SubscriptionTransport } from '@chainlink/external-adapter-framework/transports/abstract/subscription'
import { EndpointContext } from '@chainlink/external-adapter-framework/adapter'
import { Requester } from '@chainlink/external-adapter-framework/util/requester'
import { ethers } from 'ethers'
import { hex } from '@scure/base'
import { BaseEndpointTypes } from '../endpoint/proof-of-reserves'
import abi from '../config/dlc-manager-abi.json'
import {
  BitcoinTransaction,
  createTaprootMultisigPayment,
  FUNDED_STATUS,
  getBitcoinNetwork,
  getClosingTransactionInputFromFundingTransaction,
  getDerivedPublicKey,
  getUnspendableKeyCommittedToUUID,
  matchScripts,
  RawVault,
} from './utils'

const logger = makeLogger('dlcBTC PoR')

export type TransportTypes = BaseEndpointTypes

export class DLCBTCPorTransport extends SubscriptionTransport<TransportTypes> {
  name!: string
  requester!: Requester
  provider!: ethers.providers.JsonRpcProvider
  dlcManagerContract!: ethers.Contract
  settings!: TransportTypes['Settings']

  async initialize(
    dependencies: TransportDependencies<TransportTypes>,
    adapterSettings: TransportTypes['Settings'],
    endpointName: string,
    transportName: string,
  ): Promise<void> {
    await super.initialize(dependencies, adapterSettings, endpointName, transportName)
    const { RPC_URL, CHAIN_ID, DLC_CONTRACT } = adapterSettings
    this.settings = adapterSettings
    this.provider = new ethers.providers.JsonRpcProvider(RPC_URL, CHAIN_ID)
    this.dlcManagerContract = new ethers.Contract(DLC_CONTRACT, abi, this.provider)
    this.requester = dependencies.requester
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

    // Get funded vault data.
    const vaultData: RawVault[] = await this.getAllFundedDLCs()

    // Get the Attestor Public Key from the Attestor Group
    const attestorPublicKey = getDerivedPublicKey(
      await this.dlcManagerContract.attestorGroupPubKey(),
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
          try {
            const isVerified = await this.verifyVaultDeposit(vault, attestorPublicKey)
            if (isVerified) {
              return vault.valueLocked.toNumber()
            }
          } catch (e) {
            logger.error(e, `Error while verifying Deposit for Vault: ${vault.uuid}. ${e}`)
          }
          return 0
        }),
      )
      // totalPoR represents total proof of reserves value in satoshis
      totalPoR += deposits.reduce((sum, deposit) => sum + deposit, 0)
    }

    return {
      data: {
        result: totalPoR,
      },
      statusCode: 200,
      result: totalPoR,
      timestamps: {
        providerDataRequestedUnixMs,
        providerDataReceivedUnixMs: Date.now(),
        providerIndicatedTimeUnixMs: undefined,
      },
    }
  }

  async getAllFundedDLCs(): Promise<RawVault[]> {
    const fundedVaults: RawVault[] = []
    for (let totalFetched = 0; ; totalFetched += this.settings.EVM_RPC_BATCH_SIZE) {
      const fetchedVaults: RawVault[] = await this.dlcManagerContract.getAllDLCs(
        totalFetched,
        totalFetched + this.settings.EVM_RPC_BATCH_SIZE,
      )
      // Filter placeholder and non funded vaults
      fundedVaults.push(
        ...fetchedVaults.filter(
          (vault) =>
            vault.status === FUNDED_STATUS &&
            vault.uuid !== '0x0000000000000000000000000000000000000000000000000000000000000000',
        ),
      )

      if (fetchedVaults.length !== this.settings.EVM_RPC_BATCH_SIZE) {
        break
      }
    }
    return fundedVaults
  }

  async verifyVaultDeposit(vault: RawVault, attestorPublicKey: Buffer) {
    if (!vault.fundingTxId || !vault.taprootPubKey || !vault.valueLocked || !vault.uuid) {
      return false
    }
    // Get the bitcoin transaction
    const fundingTransaction = await this.fetchFundingTransaction(vault.fundingTxId)

    // Check and filter transactions that have less than [settings.CONFIRMATIONS] confirmations
    if (fundingTransaction.confirmations < this.settings.CONFIRMATIONS) {
      return false
    }

    // Get the Closing Transaction Input from the Funding Transaction by the locked Bitcoin value
    const closingTransactionInput = getClosingTransactionInputFromFundingTransaction(
      fundingTransaction,
      vault.valueLocked.toNumber(),
    )

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

    // Verify that the Funding Transaction's Output Script matches the expected MultiSig Script
    const acceptedScript = matchScripts(
      [multisigTransaction.script],
      hex.decode(closingTransactionInput.scriptPubKey.hex),
    )

    return acceptedScript
  }

  async fetchFundingTransaction(txId: string): Promise<BitcoinTransaction> {
    const requestConfig = {
      baseURL: this.settings.BITCOIN_RPC_URL,
      method: 'POST',
      data: {
        jsonrpc: '2.0',
        method: 'getrawtransaction',
        params: [txId, true, null],
      },
    }
    const { response } = await this.requester.request<{ result: BitcoinTransaction }>(
      txId,
      requestConfig,
    )
    return response.data.result
  }

  getSubscriptionTtlFromConfig(adapterSettings: TransportTypes['Settings']): number {
    return adapterSettings.WARMUP_SUBSCRIPTION_TTL
  }
}

export const porTransport = new DLCBTCPorTransport()
