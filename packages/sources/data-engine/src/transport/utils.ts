import { TransportGenerics } from '@chainlink/external-adapter-framework/transports'
import { ProviderResult } from '@chainlink/external-adapter-framework/util'
import Decimal from 'decimal.js'
import { config } from '../config'

export const DECIMALS = 18

/**
 * Scales a raw integer string from `fromDecimals` to `toDecimals`.
 * Uses truncation (floor toward zero) when scaling down.
 */
export function scaleDecimals(value: string, fromDecimals: number, toDecimals: number): string {
  if (fromDecimals === toDecimals) {
    return value
  }
  const diff = fromDecimals - toDecimals
  const raw = new Decimal(value)
  const scaled = raw.div(new Decimal(10).pow(diff))
  return scaled.toFixed(0, Decimal.ROUND_DOWN)
}

type BaseTransportTypes = {
  Parameters: TransportGenerics['Parameters']
  Response: TransportGenerics['Response']
  Settings: TransportGenerics['Settings'] & typeof config.settings
}

type ProviderTypes = {
  Provider: {
    WsMessage: {
      report?: {
        feedID: string
        fullReport: string
      }
    }
  }
}

/**
 * Fan out a single decoded report into one ProviderResult per unique subscription
 * matching the given feedId. Applies optional `resultPath` selection and `decimals`
 * scaling to produce the `result` field for each subscription variant.
 *
 * When no subscriptions match (e.g. before the first url callback), returns a
 * single result with `result: null`.
 *
 * Uses an array (not Set) for deduplication to ensure deterministic iteration order.
 */
export function fanOutResults<BaseEndpointTypes extends BaseTransportTypes>(
  feedId: string,
  data: BaseEndpointTypes['Response']['Data'],
  currentDesiredSubs: Record<string, unknown>[],
): ProviderResult<BaseEndpointTypes & ProviderTypes>[] {
  const matchingSubs = currentDesiredSubs.filter((s) => s.feedId === feedId)

  if (matchingSubs.length === 0) {
    return [
      {
        params: { feedId } as any,
        response: { result: null, data },
      },
    ]
  }

  const seen: string[] = []
  const results: ProviderResult<BaseEndpointTypes & ProviderTypes>[] = []

  for (const sub of matchingSubs) {
    const resultPath = sub.resultPath as string | undefined
    const decimals = sub.decimals as number | undefined

    // Build params with only defined fields to ensure cache key match
    const params: Record<string, unknown> = { feedId }
    if (resultPath !== undefined) params.resultPath = resultPath
    if (decimals !== undefined) params.decimals = decimals

    const key = JSON.stringify(params)
    if (seen.includes(key)) continue
    seen.push(key)

    let result: string | null = null
    if (resultPath) {
      const raw = (data as Record<string, unknown>)[resultPath]
      if (raw !== undefined) {
        result = String(raw)
        if (decimals !== undefined) {
          result = scaleDecimals(result, DECIMALS, decimals)
        }
      }
    }

    results.push({
      params: params as any,
      response: { result, data },
    })
  }

  return results
}
