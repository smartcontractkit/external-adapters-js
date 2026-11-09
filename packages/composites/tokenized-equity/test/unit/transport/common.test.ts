import { inputDefinition } from '../../../src/endpoint/common'
import type { BaseEndpointTypes } from '../../../src/endpoint/price'
import { SmoothedPriceTransport } from '../../../src/transport/common'

class TestTransport extends SmoothedPriceTransport<BaseEndpointTypes> {
  async _handleRequest() {
    return {}
  }
}

const { dedupeParams } = new TestTransport()

type Params = typeof inputDefinition.validated
type IssuerParams = Params & { registry?: string; network?: string }

const base: Params = {
  asset: '0xA',
  regularStreamId: '0x1',
  extendedStreamId: '0x2',
  overnightStreamId: undefined,
  overnightStreamMaxAgeInSeconds: 300,
  sessionMarket: 'nyse',
  sessionMarketType: '24/5',
  sessionBoundaries: ['04:00', '16:00', '20:00'],
  sessionBoundariesTimeZone: 'America/New_York',
  smoother: 'kalman',
  decimals: 8,
}

describe('dedupeParams', () => {
  it('returns an empty array for no entries', () => {
    expect(dedupeParams([])).toEqual([])
  })

  it('returns a single entry unchanged', () => {
    expect(dedupeParams([base])).toEqual([base])
  })

  it('collapses entries that differ only by smoother and keeps the first one', () => {
    const kalman: Params = { ...base, smoother: 'kalman' }
    const ema: Params = { ...base, smoother: 'ema' }
    const none: Params = { ...base, smoother: 'none' }

    const result = dedupeParams([kalman, ema, none])

    expect(result).toHaveLength(1)
    expect(result[0]).toBe(kalman)
  })

  it('keeps entries that differ in any shared param', () => {
    const entries: Params[] = [
      base,
      { ...base, asset: '0xB' },
      { ...base, regularStreamId: '0x9' },
      { ...base, overnightStreamId: '0x3' },
      { ...base, overnightStreamMaxAgeInSeconds: 60 },
      { ...base, sessionMarket: 'nasdaq' },
      { ...base, sessionMarketType: '24/7' },
      { ...base, sessionBoundaries: ['09:30', '16:00'] },
      { ...base, sessionBoundariesTimeZone: 'UTC' },
      { ...base, decimals: 18 },
    ]

    expect(dedupeParams(entries)).toEqual(entries)
  })

  it('keeps entries that differ only in an issuer-specific param', () => {
    const entries: IssuerParams[] = [
      base,
      { ...base, registry: '0xR1' },
      { ...base, registry: '0xR2' },
      { ...base, network: 'mainnet' },
      { ...base, network: 'testnet' },
    ]

    expect(dedupeParams(entries)).toEqual(entries)
  })

  it('collapses issuer entries that differ only by smoother', () => {
    const entries: IssuerParams[] = [
      { ...base, registry: '0xR', smoother: 'kalman' },
      { ...base, registry: '0xR', smoother: 'ema' },
      { ...base, network: 'mainnet', smoother: 'kalman' },
      { ...base, network: 'mainnet', smoother: 'none' },
    ]

    expect(dedupeParams(entries)).toEqual([entries[0], entries[2]])
  })

  it('preserves first-seen order of the surviving entries', () => {
    const a: Params = { ...base, asset: '0xA' }
    const b: Params = { ...base, asset: '0xB' }

    expect(dedupeParams([b, { ...a, smoother: 'ema' }, a, { ...b, smoother: 'none' }])).toEqual([
      b,
      { ...a, smoother: 'ema' },
    ])
  })

  it('ignores the order of keys', () => {
    const reordered = Object.fromEntries(Object.entries(base).reverse()) as Params

    expect(Object.keys(reordered)).not.toEqual(Object.keys(base))
    expect(dedupeParams([base, reordered])).toEqual([base])
  })

  it('treats an absent optional param the same as an explicit undefined', () => {
    const withoutOvernight = Object.fromEntries(
      Object.entries(base).filter(([key]) => key !== 'overnightStreamId'),
    ) as Params

    expect(base).toHaveProperty('overnightStreamId')
    expect(withoutOvernight).not.toHaveProperty('overnightStreamId')
    expect(dedupeParams([base, withoutOvernight])).toEqual([base])
  })

  it('does not conflate array values that would collide when joined', () => {
    const entries: Params[] = [
      { ...base, sessionBoundaries: ['04:00', '16:00'] },
      { ...base, sessionBoundaries: ['04:00|16:00'] },
      { ...base, sessionBoundaries: ['04:00,16:00'] },
    ]

    expect(dedupeParams(entries)).toEqual(entries)
  })

  it('does not mutate the input entries', () => {
    const entries: Params[] = [base, { ...base, smoother: 'ema' }]
    const snapshot = JSON.parse(JSON.stringify(entries))

    dedupeParams(entries)

    expect(entries).toEqual(snapshot)
  })
})
