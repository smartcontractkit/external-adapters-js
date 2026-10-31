import type { AxiosResponse } from 'axios'
import { porTransport } from '../../src/transport/por'

const parseResponse = (
  porTransport as unknown as {
    config: { parseResponse: (params: any[], res: AxiosResponse) => any[] }
  }
).config.parseResponse

const param = { fundId: 'michigan-pilot', reportValue: 'totalReserve' } as any

const res = (data: unknown): AxiosResponse => ({ data } as AxiosResponse)

describe('por transport parseResponse', () => {
  it('converts the totalReserve string and parses updatedAt', () => {
    const [result] = parseResponse(
      [param],
      res({
        accountName: 'SPIRO-MI-1',
        totalReserve: '5400000.00',
        totalToken: '5400000.000000',
        updatedAt: '2026-10-13T00:05:00.000Z',
        ripcord: false,
        ripcordDetails: [],
      }),
    )
    expect(result.response.data.result).toBe(5400000)
    expect(result.response.data.totalReserves).toBe(5400000)
    expect(typeof result.response.data.result).toBe('number')
    expect(result.response.timestamps.providerIndicatedTimeUnixMs).toBe(1791849900000)
  })

  it('returns a 502 when totalReserve is missing', () => {
    const [result] = parseResponse(
      [param],
      res({
        accountName: 'SPIRO-MI-1',
        updatedAt: '2026-10-13T00:05:00.000Z',
        ripcord: false,
      }),
    )
    expect(result.response.statusCode).toBe(502)
  })

  it('returns a 502 when totalReserve is not a number', () => {
    const [result] = parseResponse(
      [param],
      res({
        accountName: 'SPIRO-MI-1',
        totalReserve: 'not-a-number',
        updatedAt: '2026-10-13T00:05:00.000Z',
        ripcord: false,
      }),
    )
    expect(result.response.statusCode).toBe(502)
    expect(result.response.errorMessage).toContain('valid totalReserve')
  })
})
