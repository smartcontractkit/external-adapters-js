import { SubscriptionTransport } from '@chainlink/external-adapter-framework/transports/abstract/subscription'
import { makeLogger } from '@chainlink/external-adapter-framework/util'
import { config } from '../config'
import { BaseEndpointTypes } from '../endpoint/reserves'
import { calculateReserves, fetchAndCalculateVaultAddresses } from '../lib'

const logger = makeLogger('BtcPorTransport')

class BtcPorTransport extends SubscriptionTransport<BaseEndpointTypes> {
  async backgroundHandler(
    context: { adapterSettings: typeof config.settings },
    entries: { id: string }[],
  ): Promise<void> {
    if (entries.length === 0) return

    const { ATTESTER_API_URL, CHAIN_NAME, BITCOIN_RPC_ENDPOINT, MIN_CONFIRMATIONS } =
      context.adapterSettings
    const providerDataRequestedUnixMs = Date.now()

    try {
      logger.info(`Starting PoR calculation for chain: ${CHAIN_NAME}`)

      // Fetch xpub and deposit IDs from Attester API, calculate and verify addresses
      const { addresses } = await fetchAndCalculateVaultAddresses(ATTESTER_API_URL, CHAIN_NAME)

      if (addresses.length === 0) {
        throw new Error(`No vault addresses found for chain: ${CHAIN_NAME}`)
      }

      logger.info(
        `Found ${addresses.length} vault addresses, minConfirmations=${MIN_CONFIRMATIONS}`,
      )

      // Calculate reserves (returns BigInt for precision)
      const totalReservesBigInt = await calculateReserves(
        BITCOIN_RPC_ENDPOINT,
        addresses,
        MIN_CONFIRMATIONS,
      )

      // Convert BigInt to Number for JSON response
      // Note: This is safe for Bitcoin (max 21M BTC = 2.1e15 sats < Number.MAX_SAFE_INTEGER)
      const totalReserves = Number(totalReservesBigInt)

      logger.info(`PoR complete: ${totalReserves} sats (${addresses.length} addresses)`)

      await this.responseCache.write(this.name, [
        {
          params: {},
          response: {
            result: totalReserves,
            data: { result: totalReserves },
            timestamps: {
              providerDataRequestedUnixMs,
              providerDataReceivedUnixMs: Date.now(),
              providerIndicatedTimeUnixMs: undefined,
            },
          },
        },
      ])
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error)
      logger.error(`PoR calculation failed: ${errorMessage}`)

      await this.responseCache.write(this.name, [
        {
          params: {},
          response: {
            statusCode: 502,
            errorMessage,
            timestamps: {
              providerDataRequestedUnixMs: 0,
              providerDataReceivedUnixMs: 0,
              providerIndicatedTimeUnixMs: undefined,
            },
          },
        },
      ])
    }
  }

  getSubscriptionTtlFromConfig(adapterSettings: typeof config.settings): number {
    return adapterSettings.WARMUP_SUBSCRIPTION_TTL
  }
}

export const transport = new BtcPorTransport()
