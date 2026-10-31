import nock from 'nock'

const API = 'http://test-api.com'

const headers = ['Content-Type', 'application/json', 'Connection', 'close']

export const mockNavSuccess = (fundId: string): nock.Scope =>
  nock(API, { reqheaders: { 'x-api-key': 'fake-key' } })
    .get(`/api/chainlink/funds/${fundId}/nav-daily`)
    .reply(
      200,
      {
        fund_id: fundId,
        fund_name: 'Spiro Oil NAV — Michigan Antrim Gas Facility (test)',
        data: [
          {
            fund_id: fundId,
            net_asset_value_date: '2026-10-13',
            net_asset_value: '1.000000',
            assets_under_management: '5400000.00',
            outstanding_shares: '5400000.000000',
            net_income_expenses: '961.64',
          },
        ],
        min_rate: 0.95,
        max_rate: 1.1,
        updatedAt: '2026-10-13T00:05:00.000Z',
        ripcord: false,
        ripcordDetails: [],
      },
      headers,
    )
    .persist()

export const mockNavOutOfOrder = (fundId: string): nock.Scope =>
  nock(API, { reqheaders: { 'x-api-key': 'fake-key' } })
    .get(`/api/chainlink/funds/${fundId}/nav-daily`)
    .reply(
      200,
      {
        fund_id: fundId,
        data: [
          {
            fund_id: fundId,
            net_asset_value_date: '2026-10-11',
            net_asset_value: '0.990000',
            assets_under_management: '5300000.00',
            outstanding_shares: '5300000.000000',
            net_income_expenses: '950.00',
          },
          {
            fund_id: fundId,
            net_asset_value_date: '2026-10-13',
            net_asset_value: '1.000000',
            assets_under_management: '5400000.00',
            outstanding_shares: '5400000.000000',
            net_income_expenses: '961.64',
          },
          {
            fund_id: fundId,
            net_asset_value_date: '2026-10-12',
            net_asset_value: '0.995000',
            assets_under_management: '5350000.00',
            outstanding_shares: '5350000.000000',
            net_income_expenses: '955.00',
          },
        ],
        ripcord: false,
        ripcordDetails: [],
      },
      headers,
    )
    .persist()

export const mockNavRipcord = (fundId: string): nock.Scope =>
  nock(API, { reqheaders: { 'x-api-key': 'fake-key' } })
    .get(`/api/chainlink/funds/${fundId}/nav-daily`)
    .reply(
      200,
      {
        fund_id: fundId,
        data: [
          {
            fund_id: fundId,
            net_asset_value_date: '2026-10-13',
            net_asset_value: '1.000000',
            assets_under_management: '5400000.00',
            outstanding_shares: '5400000.000000',
            net_income_expenses: '961.64',
          },
        ],
        ripcord: true,
        ripcordDetails: ['NAV data source unavailable'],
      },
      headers,
    )
    .persist()

export const mockNavEmpty = (fundId: string): nock.Scope =>
  nock(API, { reqheaders: { 'x-api-key': 'fake-key' } })
    .get(`/api/chainlink/funds/${fundId}/nav-daily`)
    .reply(200, { fund_id: fundId, data: [], ripcord: false, ripcordDetails: [] }, headers)
    .persist()

export const mockPorSuccess = (fundId: string): nock.Scope =>
  nock(API, { reqheaders: { 'x-api-key': 'fake-key' } })
    .get(`/api/chainlink/funds/${fundId}/reserves`)
    .reply(
      200,
      {
        accountName: 'SPIRO-MI-1',
        totalReserve: '5400000.00',
        totalToken: '5400000.000000',
        updatedAt: '2026-10-13T00:05:00.000Z',
        ripcord: false,
        ripcordDetails: [],
      },
      headers,
    )
    .persist()

export const mockPorRipcord = (fundId: string): nock.Scope =>
  nock(API, { reqheaders: { 'x-api-key': 'fake-key' } })
    .get(`/api/chainlink/funds/${fundId}/reserves`)
    .reply(
      200,
      {
        accountName: 'SPIRO-MI-1',
        totalReserve: '5400000.00',
        totalToken: '5400000.000000',
        updatedAt: '2026-10-13T00:05:00.000Z',
        ripcord: true,
        ripcordDetails: ['Reserve attestation pending'],
      },
      headers,
    )
    .persist()
