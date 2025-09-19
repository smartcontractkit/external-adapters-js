import Decimal from 'decimal.js'
import type {
  Data as DataProto,
  Decimal as DecimalProto,
  MarketData as MarketDataProto,
} from '../gen/md_cef_pb'
const MAX_SAFE = BigInt(Number.MAX_SAFE_INTEGER)

export function decimalToNumber(decimal?: DecimalProto): number {
  if (!decimal || decimal.m === undefined || decimal.e === undefined) {
    throw new Error('Invalid price')
  }

  const { m: mantissa, e: exponent } = decimal

  // Safety: converting a bigint > Number.MAX_SAFE_INTEGER loses precision.
  if (mantissa > MAX_SAFE || mantissa < -MAX_SAFE) {
    throw new Error(`Invalid price due to potential overflow, mantissa: ${mantissa.toString()}`)
  }

  return new Decimal(mantissa.toString()).times(Decimal.pow(10, exponent)).toNumber()
}

export function convertNsToMs(t?: bigint): number {
  if (t == null) {
    throw new Error('Invalid timestamp')
  }
  return Math.floor(Number(t) / 1e6)
}

export function parseIsin(md: MarketDataProto): string | undefined {
  const instr = md.Instrmt
  if (!instr) return
  const sym = instr.Sym
  return (typeof sym === 'string' && sym) || undefined
}

export function pickProviderTime(dat: DataProto): number {
  return convertNsToMs(dat?.Tm)
}

export function isDecimalPrice(x?: DecimalProto): boolean {
  return !!x && (typeof x.m === 'bigint' || typeof x.m === 'number') && typeof x.e === 'number'
}

// true if this frame is exactly a "single trade price"
export function isSingleTradeFrame(dat?: DataProto): boolean {
  return isDecimalPrice(dat?.Px)
}

// true if this frame carries only a single best bid/offer (not multui-level)
export function isSingleQuoteFrame(dat?: DataProto): boolean {
  return isDecimalPrice(dat?.Bid?.Px) && isDecimalPrice(dat?.Offer?.Px)
}
