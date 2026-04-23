import type { MarketStatusResult } from '../transport/base-market-status'
import { getStatus as get245Status } from './hard-code-245'

const mapping = {
  HARD_CODE_245: get245Status,
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
