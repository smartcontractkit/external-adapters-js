import type { Data, Decimal, MarketData } from '../gen/md_cef_pb'

const MAX_SAFE = BigInt(Number.MAX_SAFE_INTEGER)

export function decimalToNumber(decimal?: Decimal): number {
  if (!decimal) {
    throw new Error('Invalid price')
  }
  const { m, e } = decimal
  if (m === undefined || e === undefined) {
    throw new Error('Invalid price')
  }

  // Safety: converting a bigint > Number.MAX_SAFE_INTEGER loses precision.
  if (m > MAX_SAFE || m < -MAX_SAFE) {
    throw new Error(`Invalid price due to potential overflow, mantissa: ${m.toString()}`)
  }

  const n = Number(m) * Math.pow(10, e)
  if (!Number.isFinite(n)) {
    throw new Error(`Invalid price due to potential overflow, mantissa: ${m.toString()}`)
  }
  return n
}

export function convertNsToMs(t?: bigint): number {
  if (t == null) {
    throw new Error('Invalid timestamp')
  }
  return Math.floor(Number(t) / 1e6)
}

export function getIsin(md: MarketData): string | undefined {
  const instr = md.Instrmt
  if (!instr) return
  const sym = instr.Sym
  return (typeof sym === 'string' && sym) || undefined
}

export function pickProviderTime(dat: Data): number {
  return convertNsToMs(dat?.Tm)
}

export function isDecimalPrice(x?: Decimal): boolean {
  return (
    !!x && (typeof x.m === 'bigint' || typeof (x as any).m === 'number') && typeof x.e === 'number'
  )
}

// true if this frame is exactly a "single trade price"
export function isSingleTradeFrame(dat?: Data): boolean {
  return isDecimalPrice(dat?.Px)
}

// true if this frame carries only a single best bid/offer (not multui-level)
export function isSingleQuoteFrame(dat?: Data): boolean {
  return isDecimalPrice(dat?.Bid?.Px) && isDecimalPrice(dat?.Offer?.Px)
}
