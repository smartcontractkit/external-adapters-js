import Decimal from 'decimal.js'
import {
  Instrument_SecurityType,
  type Data as DataProto,
  type Decimal as DecimalProto,
  type MarketData as MarketDataProto,
} from '../gen/md_cef_pb'

const MAX_SIG_DIGITS = 15
export function decimalToNumber(decimal?: DecimalProto): number {
  if (!decimal || decimal.m === undefined || decimal.e === undefined) {
    throw new Error('Invalid price')
  }

  const { m: mantissa, e: exponent } = decimal

  const product = Decimal(mantissa.toString()).times(Decimal.pow(10, exponent))
  const rounded = product.toSignificantDigits(MAX_SIG_DIGITS)
  if (!rounded.eq(product)) {
    throw new Error(
      `Value requires more than ${MAX_SIG_DIGITS} significant digits: ${product.toString()}`,
    )
  }
  const num = product.toNumber()
  if (!Number.isFinite(num)) {
    throw new Error('Overflow converting decimal to number')
  }
  return num
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

// true if this frame carries a single best bid (not multui-level)
export function hasSingleBidFrame(dat?: DataProto): boolean {
  return isDecimalPrice(dat?.Bid?.Px)
}

// true if this frame carries a single best offer (not multui-level)
export function hasSingleOfferFrame(dat?: DataProto): boolean {
  return isDecimalPrice(dat?.Offer?.Px)
}

// true if this instrument type is Future
export function isFutureInstrument(md: MarketDataProto): boolean {
  return md.Instrmt?.SecTyp === Instrument_SecurityType.FUT
}
