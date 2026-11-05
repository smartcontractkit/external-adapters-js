import nock from 'nock'
import type {
  ResponseSchema as NavResponse,
  ResponseSchemaEntry as NavEntry,
} from '../../src/transport/nav'
import type { ResponseSchema as PorResponse } from '../../src/transport/por'

export const API = 'http://test-api.com'

export const navEntry = (fundId: string, overrides: Partial<NavEntry> = {}): NavEntry => ({
  fund_id: fundId,
  net_asset_value_date: '2026-10-13',
  net_asset_value: '1.000000',
  assets_under_management: '5400000.00',
  outstanding_shares: '9999999.000000',
  net_income_expenses: '961.64',
  ...overrides,
})

export const navResponse = (fundId: string, overrides: Partial<NavResponse> = {}): NavResponse => ({
  fund_id: fundId,
  fund_name: 'Spiro Oil NAV — Michigan Antrim Gas Facility (test)',
  data: [navEntry(fundId)],
  min_rate: 0.95,
  max_rate: 1.1,
  updatedAt: '2026-10-13T00:05:00.000Z',
  ripcord: false,
  ripcordDetails: [],
  ...overrides,
})

export const porResponse = (overrides: Partial<PorResponse> = {}): PorResponse => ({
  accountName: 'SPIRO-MI-1',
  totalReserve: '5400000.00',
  totalToken: '12345.000000',
  updatedAt: '2026-10-13T00:05:00.000Z',
  ripcord: false,
  ripcordDetails: [],
  ...overrides,
})

const mockGet = (path: string, body: string | object): nock.Scope =>
  nock(API, { reqheaders: { 'x-api-key': 'fake-key' } })
    .get(path)
    .reply(200, body as string | Record<string, unknown>, ['Content-Type', 'application/json'])
    .persist()

export const mockNav = (fundId: string, body: string | object) =>
  mockGet(`/api/chainlink/funds/${fundId}/nav-daily`, body)

export const mockPor = (fundId: string, body: string | object) =>
  mockGet(`/api/chainlink/funds/${fundId}/reserves`, body)

export const mockProviderError = (
  endpoint: 'nav' | 'por',
  fundId: string,
  status: number,
  body: object,
) => {
  const path = endpoint === 'nav' ? 'nav-daily' : 'reserves'
  return nock(API, { reqheaders: { 'x-api-key': 'fake-key' } })
    .get(`/api/chainlink/funds/${fundId}/${path}`)
    .reply(status, body, ['Content-Type', 'application/json'])
    .persist()
}
