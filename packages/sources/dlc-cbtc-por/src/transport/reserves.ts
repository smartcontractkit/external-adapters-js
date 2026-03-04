import { EndpointContext } from '@chainlink/external-adapter-framework/adapter'
import { TransportDependencies } from '@chainlink/external-adapter-framework/transports'
import { SubscriptionTransport } from '@chainlink/external-adapter-framework/transports/abstract/subscription'
import { makeLogger, sleep } from '@chainlink/external-adapter-framework/util'
import { Requester } from '@chainlink/external-adapter-framework/util/requester'
import { config } from '../config'
import { BaseEndpointTypes } from '../endpoint/reserves'
import { calculateReserves, fetchAndCalculateVaultAddresses } from '../lib/btc'
import { medianBigInt, parseUrls } from '../utils'

const logger = makeLogger('BtcPorTransport')

class BtcPorTransport extends SubscriptionTransport<BaseEndpointTypes> {
  requester!: Requester

  async initialize(
    dependencies: TransportDependencies<BaseEndpointTypes>,
    adapterSettings: BaseEndpointTypes['Settings'],
    endpointName: string,
    transportName: string,
  ): Promise<void> {
    await super.initialize(dependencies, adapterSettings, endpointName, transportName)
    this.requester = dependencies.requester
  }

  async backgroundHandler(
    context: EndpointContext<BaseEndpointTypes>,
    _entries: BaseEndpointTypes['Parameters'][],
  ): Promise<void> {
    await this.handleRequest(context)
    await sleep(context.adapterSettings.BACKGROUND_EXECUTE_MS)
  }

  async handleRequest(context: EndpointContext<BaseEndpointTypes>): Promise<void> {
    const { ATTESTER_API_URLS, CHAIN_NAME, BITCOIN_RPC_ENDPOINT } = context.adapterSettings
    const MIN_CONFIRMATIONS = 1

    const providerDataRequestedUnixMs = Date.now()
    const attesterUrls = parseUrls(ATTESTER_API_URLS)

    try {
      logger.info(
        `Starting PoR calculation for chain: ${CHAIN_NAME} with ${attesterUrls.length} attesters`,
      )

      // Query each attester and calculate reserves independently
      const results = await Promise.allSettled(
        attesterUrls.map(async (attesterUrl) => {
          const { addresses } = await fetchAndCalculateVaultAddresses(
            this.requester,
            attesterUrl,
            CHAIN_NAME,
          )
          if (addresses.length === 0) {
            throw new Error(`No vault addresses found for chain: ${CHAIN_NAME}`)
          }
          return calculateReserves(
            this.requester,
            BITCOIN_RPC_ENDPOINT,
            addresses,
            MIN_CONFIRMATIONS,
          )
        }),
      )

      // Collect successful reserves calculations
      const reserves: bigint[] = []
      results.forEach((result, i) => {
        if (result.status === 'fulfilled') {
          reserves.push(result.value)
          logger.debug(`Attester ${i + 1}: ${result.value} sats`)
        } else {
          logger.warn(`Attester ${i + 1} failed: ${result.reason}`)
        }
      })

      if (reserves.length < 1) {
        throw new Error('No successful attester responses')
      }

      const medianReserves = medianBigInt(reserves)
      const totalReserves = medianReserves.toString()

      logger.info(
        `PoR complete: median=${totalReserves} sats (${reserves.length}/${attesterUrls.length} attesters)`,
      )

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
