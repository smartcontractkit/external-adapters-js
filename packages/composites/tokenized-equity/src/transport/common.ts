import '@chainlink/external-adapter-framework'

import { EndpointContext } from '@chainlink/external-adapter-framework/adapter'
import { TransportDependencies } from '@chainlink/external-adapter-framework/transports'
import { SubscriptionTransport } from '@chainlink/external-adapter-framework/transports/abstract/subscription'
import { AdapterResponse, makeLogger, sleep } from '@chainlink/external-adapter-framework/util'
import { Requester } from '@chainlink/external-adapter-framework/util/requester'
import { AdapterError } from '@chainlink/external-adapter-framework/validation/error'
import { TypeFromDefinition } from '@chainlink/external-adapter-framework/validation/input-params'
import type { config } from '../config'
import type { inputDefinition, output, Smoother } from '../endpoint/common'

export type CommonEndpointTypes = {
  // Allow each endpoint to have different descriptions for the same input param
  Parameters: {
    [K in keyof typeof inputDefinition.definition]: Omit<
      (typeof inputDefinition.definition)[K],
      'description'
    > & { description: string }
  }
  Response: {
    Result: string
    Data: output
  }
  Settings: typeof config.settings
}

// Allow reference to smoother in the base class
export type SmoothedPriceParams<T extends CommonEndpointTypes> = TypeFromDefinition<
  T['Parameters']
> & { smoother: Smoother }

// Each subclass to override `initialize` and implement `_handleRequest`
export abstract class SmoothedPriceTransport<
  T extends CommonEndpointTypes,
> extends SubscriptionTransport<T> {
  private logger = makeLogger(this.constructor.name)

  requester!: Requester
  config!: T['Settings']

  async initialize(
    dependencies: TransportDependencies<T>,
    adapterSettings: T['Settings'],
    endpointName: string,
    transportName: string,
  ): Promise<void> {
    await super.initialize(dependencies, adapterSettings, endpointName, transportName)
    this.requester = dependencies.requester
    this.config = adapterSettings
  }

  async backgroundHandler(context: EndpointContext<T>, entries: SmoothedPriceParams<T>[]) {
    await Promise.all(this.dedupeParams(entries).map(async (param) => this.handleRequest(param)))
    await sleep(context.adapterSettings.BACKGROUND_EXECUTE_MS)
  }

  async handleRequest(param: SmoothedPriceParams<T>) {
    let responses: Partial<Record<Smoother, AdapterResponse<T['Response']>>>
    try {
      responses = await this._handleRequest(param)
    } catch (e) {
      const errorMessage = e instanceof Error ? e.message : 'Unknown error occurred'
      this.logger.error(e, errorMessage)

      const errorResponse = {
        statusCode: (e as AdapterError)?.statusCode || 502,
        errorMessage,
        timestamps: {
          providerDataRequestedUnixMs: 0,
          providerDataReceivedUnixMs: 0,
          providerIndicatedTimeUnixMs: undefined,
        },
      }
      responses =
        param.smoother === 'none'
          ? { none: errorResponse }
          : {
              ema: errorResponse,
              kalman: errorResponse,
            }
    }

    await this.responseCache.write(
      this.name,
      Object.entries(responses).map(([key, value]) => {
        return {
          params: {
            ...param,
            smoother: key as Smoother,
          },
          response: value,
        }
      }),
    )
  }

  abstract _handleRequest(
    param: SmoothedPriceParams<T>,
  ): Promise<Record<string, AdapterResponse<T['Response']>>>

  getSubscriptionTtlFromConfig(adapterSettings: T['Settings']): number {
    return adapterSettings.WARMUP_SUBSCRIPTION_TTL
  }

  getDataEngineUrl() {
    return this.config.SOURCE_ADAPTER_URL.get('DATA_ENGINE')
  }

  getTradingHoursUrl() {
    return this.config.SOURCE_ADAPTER_URL.get('TRADING_HOURS')
  }

  // Two input parameters with different smoother are considered the same
  dedupeParams = (params: SmoothedPriceParams<T>[]): SmoothedPriceParams<T>[] => {
    const seen = new Map<string, SmoothedPriceParams<T>>()
    for (const p of params) {
      const key = JSON.stringify(
        Object.entries(p)
          .filter(([k, v]) => k !== 'smoother' && v !== undefined)
          .sort(([a], [b]) => a.localeCompare(b)),
      ).toLowerCase()
      if (!seen.has(key)) {
        seen.set(key, p)
      }
    }
    return Array.from(seen.values())
  }
}
