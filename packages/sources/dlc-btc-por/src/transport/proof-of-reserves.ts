import { TransportDependencies } from '@chainlink/external-adapter-framework/transports'
import { AdapterResponse, makeLogger, sleep } from '@chainlink/external-adapter-framework/util'
import { SubscriptionTransport } from '@chainlink/external-adapter-framework/transports/abstract/subscription'
import { EndpointContext } from '@chainlink/external-adapter-framework/adapter'
import { Requester } from '@chainlink/external-adapter-framework/util/requester'
import { ethers } from 'ethers'
import { hex } from '@scure/base'
import { p2tr, p2tr_ns, taprootTweakPubkey, TAPROOT_UNSPENDABLE_KEY } from '@scure/btc-signer'
import { BaseEndpointTypes } from '../endpoint/proof-of-reserves'
import abi from '../config/dlc-manager-abi.json'
import {
  BitcoinNetwork,
  BitcoinTransaction,
  BitcoinTransactionVectorOutput,
  FUNDED_STATUS,
  getBitcoinNetwork,
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

    // Get the Attestor Public Key
    const attestorPublicKey = await this.dlcManagerContract.attestorGroupPubKey()

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

  async verifyVaultDeposit(vault: RawVault, attestorPublicKey: string) {
    // Get the bitcoin transaction
    const fundingTransaction = await this.fetchFundingTransaction(vault.fundingTxId)

    // Check and filter transactions that have less than [settings.CONFIRMATIONS] confirmations
    if (fundingTransaction.confirmations < this.settings.CONFIRMATIONS) {
      return false
    }

    // Get the Closing Transaction Input from the Funding Transaction by the locked Bitcoin value
    const closingTransactionInput = this.getClosingTransactionInputFromFundingTransaction(
      fundingTransaction,
      vault.valueLocked.toNumber(),
    )

    // Get the Bitcoin network object
    const bitCoinNetwork = getBitcoinNetwork(this.settings.BITCOIN_NETWORK)

    // Create two MultiSig Transactions, because the User and Attestor can sign in any order
    // Create the MultiSig Transaction A
    const multisigTransactionA = this.createMultiSigTransaction(
      vault.taprootPubKey,
      attestorPublicKey,
      vault.uuid,
      bitCoinNetwork,
    )

    // Create the MultiSig Transaction B
    const multisigTransactionB = this.createMultiSigTransaction(
      attestorPublicKey,
      vault.taprootPubKey,
      vault.uuid,
      bitCoinNetwork,
    )

    // Verify that the Funding Transaction's Output Script matches the expected MultiSig Script
    return this.matchScripts(
      [multisigTransactionA.script, multisigTransactionB.script],
      hex.decode(closingTransactionInput.scriptPubKey.hex),
    )
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

  getClosingTransactionInputFromFundingTransaction(
    fundingTransaction: BitcoinTransaction,
    bitcoinValue: number,
  ): BitcoinTransactionVectorOutput {
    const closingTransactionInput = fundingTransaction.vout.find(
      // bitcoinValue in the vault is represented in satoshis, convert the transaction value to compare
      (output) => output.value * 10 ** 8 === bitcoinValue,
    )
    if (!closingTransactionInput) {
      throw new Error('Could not find Closing Transaction Input.')
    }
    return closingTransactionInput
  }

  createMultiSigTransaction(
    publicKeyA: string,
    publicKeyB: string,
    vaultUUID: string,
    bitcoinNetwork: BitcoinNetwork,
  ) {
    // Tweak the unspendable key with a unique vault UUID
    const tweakedUnspendableTaprootKey = taprootTweakPubkey(
      TAPROOT_UNSPENDABLE_KEY,
      Buffer.from(vaultUUID),
    )[0]

    // Create a 2-of-2 multisig script
    const multisigPayment = p2tr_ns(2, [hex.decode(publicKeyA), hex.decode(publicKeyB)])
    // Construct a taproot transaction using tweaked unspendable key and the multisig output
    const multisigTransaction = p2tr(tweakedUnspendableTaprootKey, multisigPayment, bitcoinNetwork)
    // Store the tweaked key for unblocking the output
    multisigTransaction.tapInternalKey = tweakedUnspendableTaprootKey

    return multisigTransaction
  }

  matchScripts(multisigScripts: Uint8Array[], outputScript: Uint8Array): boolean {
    return multisigScripts.some(
      (multisigScript) =>
        outputScript.length === multisigScript.length &&
        outputScript.every((value, index) => value === multisigScript[index]),
    )
  }

  getSubscriptionTtlFromConfig(adapterSettings: TransportTypes['Settings']): number {
    return adapterSettings.WARMUP_SUBSCRIPTION_TTL
  }
}

export const porTransport = new DLCBTCPorTransport()
