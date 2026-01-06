import { SubscriptionTransport } from '@chainlink/external-adapter-framework/transports/abstract/subscription'
import { makeLogger } from '@chainlink/external-adapter-framework/util'
import { config } from '../config'
import { BaseEndpointTypes } from '../endpoint/reserves'
import { calculateReserves, fetchAndCalculateVaultAddresses } from '../lib'

const logger = makeLogger('CbtcPorTransport')

class CbtcPorTransport extends SubscriptionTransport<BaseEndpointTypes> {
  async backgroundHandler(
    context: { adapterSettings: typeof config.settings },
    entries: { id: string }[],
  ): Promise<void> {
    if (entries.length === 0) return

    const { ATTESTER_API_URL, CHAIN_NAME, BITCOIN_RPC_ENDPOINT, MIN_CONFIRMATIONS } =
      context.adapterSettings
    const providerDataRequestedUnixMs = Date.now()

    try {
      // Step 1: Fetch xpub and deposit IDs from Attester API, calculate and verify addresses
      logger.debug(`Fetching vault addresses from Attester API for chain: ${CHAIN_NAME}`)
      const { addresses } = await fetchAndCalculateVaultAddresses(ATTESTER_API_URL, CHAIN_NAME)

      if (addresses.length === 0) {
        throw new Error(`No vault addresses found for chain: ${CHAIN_NAME}`)
      }

      logger.debug(
        `Querying ${addresses.length} vault addresses (min confirmations: ${MIN_CONFIRMATIONS})`,
      )

      const totalReserves = await calculateReserves(
        BITCOIN_RPC_ENDPOINT,
        addresses,
        MIN_CONFIRMATIONS,
      )

      logger.info(`Total reserves: ${totalReserves} sats across ${addresses.length} addresses`)

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

export const transport = new CbtcPorTransport()
