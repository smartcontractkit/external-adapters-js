import { EndpointContext } from '@chainlink/external-adapter-framework/adapter'
import { TransportDependencies } from '@chainlink/external-adapter-framework/transports'
import { SubscriptionTransport } from '@chainlink/external-adapter-framework/transports/abstract/subscription'
import { makeLogger, sleep } from '@chainlink/external-adapter-framework/util'
import { Requester } from '@chainlink/external-adapter-framework/util/requester'
import { config } from '../config'
import { BaseEndpointTypes } from '../endpoint/attester-supply'
import { calculateAttesterSupply } from '../lib'
import { AttesterResponse } from '../types'
import { buildUrl, medianBigInt, parseUrls } from '../utils'

const logger = makeLogger('AttesterSupplyTransport')

type RequestParams = Record<string, never>

class AttesterSupplyTransport extends SubscriptionTransport<BaseEndpointTypes> {
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
    _entries: RequestParams[],
  ): Promise<void> {
    await this.handleRequest(context)
    await sleep(context.adapterSettings.BACKGROUND_EXECUTE_MS)
  }

  async handleRequest(context: EndpointContext<BaseEndpointTypes>): Promise<void> {
    const { ATTESTER_API_URLS } = context.adapterSettings
    const providerDataRequestedUnixMs = Date.now()
    const attesterUrls = parseUrls(ATTESTER_API_URLS || '')

    try {
      logger.info(`Fetching CBTC supply from ${attesterUrls.length} attesters`)

      // Query each attester in parallel
      const results = await Promise.allSettled(
        attesterUrls.map(async (attesterUrl) => {
          const url = buildUrl(attesterUrl, '/app/get-total-cbtc-supply')
          const response = await this.requester.request<AttesterResponse>(url, { url })
          return BigInt(calculateAttesterSupply(response.response.data))
        }),
      )

      // Collect successful supply values
      const supplies: bigint[] = []
      results.forEach((result, i) => {
        if (result.status === 'fulfilled') {
          supplies.push(result.value)
          logger.debug(`Attester ${i + 1}: ${result.value}`)
        } else {
          logger.warn(`Attester ${i + 1} failed: ${result.reason}`)
        }
      })

      if (supplies.length < 1) {
        throw new Error('No successful attester responses')
      }

      const medianSupply = medianBigInt(supplies)
      const result = medianSupply.toString()

      logger.info(
        `Supply complete: median=${result} (${supplies.length}/${attesterUrls.length} attesters)`,
      )

      await this.responseCache.write(this.name, [
        {
          params: {},
          response: {
            result,
            data: { result },
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
      logger.error(`Supply calculation failed: ${errorMessage}`)

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

export const transport = new AttesterSupplyTransport()
