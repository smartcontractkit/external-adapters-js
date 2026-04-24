import type { MarketStatusResult } from '../transport/base-market-status'
import { getStatus as staticJpxStatus } from './static-jpx'
import { getStatus as staticKrxStatus } from './static-krx'
import { getStatus as staticNymexStatus } from './static-nymex'
import { getStatus as staticNyse245Status } from './static-nyse-245'
import { getStatus as staticSseStatus } from './static-sse'
import { getStatus as staticTpexStatus } from './static-tpex'

const mapping = {
  STATIC_NYSE_245: staticNyse245Status,
  STATIC_NYMEX: staticNymexStatus,
  STATIC_JPX: staticJpxStatus,
  STATIC_SSE: staticSseStatus,
  STATIC_TPEX: staticTpexStatus,
  STATIC_KRX: staticKrxStatus,
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
