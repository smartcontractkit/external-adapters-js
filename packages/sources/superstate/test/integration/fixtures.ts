import nock from 'nock'

export const mockResponseSuccess = (): nock.Scope =>
  nock('https://api.superstate.co/v1/funds', {
    encodedQueryParams: true,
  })
    .get('/1/nav-daily')
    // Since the date params change daily, it's safe here to return true, instead of mocking the whole DATE object
    .query(() => true)
    .reply(
      200,
      () => [
        {
          fund_id: 1,
          net_asset_value_date: '05/06/2024',
          net_asset_value: '10.170643',
          assets_under_management: '88412710.730070366913',
          outstanding_shares: '8692932.268891000000',
          net_income_expenses: '12985.55666',
        },
        {
          fund_id: 1,
          net_asset_value_date: '05/03/2024',
          net_asset_value: '10.16915',
          assets_under_management: '88399732.182192912650',
          outstanding_shares: '8692932.268891000000',
          net_income_expenses: '38082.331663',
        },
      ],
      [
        'Content-Type',
        'application/json',
        'Connection',
        'close',
        'Vary',
        'Accept-Encoding',
        'Vary',
        'Origin',
      ],
    )
    .persist()
