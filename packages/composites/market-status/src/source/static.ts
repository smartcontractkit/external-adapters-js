import type { MarketStatusResult } from '../transport/base-market-status'
import { getStatus as staticNymexStatus } from './static-nymex'
import { getStatus as staticNyse245Status } from './static-nyse-245'

const mapping = {
  STATIC_NYSE_245: staticNyse245Status,
  STATIC_NYMEX: staticNymexStatus,
}

export type StaticSourceName = keyof typeof mapping

export const isStaticSource = (name: string): name is StaticSourceName => name in mapping

export const getStatusFromStaticSchedule = (
  source: StaticSourceName,
  weekend?: string,
): MarketStatusResult => ({
  ...mapping[source](weekend),
  source,
})
