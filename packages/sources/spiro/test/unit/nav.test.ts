import type { AxiosResponse } from 'axios'
import { navTransport } from '../../src/transport/nav'

const parseResponse = (
  navTransport as unknown as {
    config: { parseResponse: (params: any[], res: AxiosResponse) => any[] }
  }
).config.parseResponse

const param = { fundId: 'michigan-pilot', reportValue: 'net_asset_value' } as any

const entry = (date: string, nav: string, aum: string) => ({
  fund_id: 'michigan-pilot',
  net_asset_value_date: date,
  net_asset_value: nav,
  assets_under_management: aum,
  outstanding_shares: '5400000.000000',
  net_income_expenses: '961.64',
})

const res = (data: unknown): AxiosResponse => ({ data } as AxiosResponse)

describe('nav transport parseResponse', () => {
  it('selects the max net_asset_value_date entry regardless of array order', () => {
    const [result] = parseResponse(
      [param],
      res({
        data: [
          entry('2026-10-11', '0.990000', '5300000.00'),
          entry('2026-10-13', '1.000000', '5400000.00'),
          entry('2026-10-12', '0.995000', '5350000.00'),
        ],
        ripcord: false,
      }),
    )
    expect(result.response.data.navDate).toBe('2026-10-13')
    expect(result.response.data.nav).toBe(1)
  })

  it('converts API decimal strings to numbers without shifting the decimal', () => {
    const [result] = parseResponse(
      [param],
      res({
        data: [entry('2026-10-13', '1.000000', '5400000.00')],
        ripcord: false,
      }),
    )
    expect(result.response.data.nav).toBe(1)
    expect(result.response.data.aum).toBe(5400000)
    expect(result.response.data.result).toBe(1)
    expect(typeof result.response.data.nav).toBe('number')
  })

  it('parses the ISO NAV date into UTC midnight ms', () => {
    const [result] = parseResponse(
      [param],
      res({
        data: [entry('2026-10-13', '1.000000', '5400000.00')],
        ripcord: false,
      }),
    )
    expect(result.response.data.navDateTimestampMs).toBe(1791849600000)
    expect(result.response.timestamps.providerIndicatedTimeUnixMs).toBe(1791849600000)
  })

  it('returns a 502 when the NAV array is empty', () => {
    const [result] = parseResponse([param], res({ data: [], ripcord: false }))
    expect(result.response.statusCode).toBe(502)
  })

  it('reports aum when reportValue is assets_under_management', () => {
    const [result] = parseResponse(
      [{ ...param, reportValue: 'assets_under_management' }],
      res({
        data: [entry('2026-10-13', '1.000000', '5400000.00')],
        ripcord: false,
      }),
    )
    expect(result.response.data.result).toBe(5400000)
  })
})
