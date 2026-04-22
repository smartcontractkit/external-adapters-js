import type { MarketStatusResult } from '../transport/base-market-status'
import { getStatus as get245Status } from './245Adapter'

const mapping = {
  HARD_CODE_245: get245Status,
}

export type StaticAdapterName = keyof typeof mapping

export const isStaticAdapter = (name: string): name is StaticAdapterName => name in mapping

export const getStatusFromStaticSchedule = (
  adapterName: StaticAdapterName,
  weekend?: string,
): MarketStatusResult => ({
  ...mapping[adapterName](weekend),
  source: adapterName,
})
