import nock from 'nock'

export const mockResponseSuccess = (): nock.Scope =>
  nock('https://onre-api-prod.ew.r.appspot.com/nav', {
    encodedQueryParams: true,
  })
    .get('')
    .reply(200, () => [
      {
        net_asset_value_date: '06/14/2025',
        net_asset_value: '2.01702150000035000',
        assets_under_management: '15172254.24630367655644876519110000',
        fund_name: 'ONe',
        fund_id: 1,
      },
      {
        net_asset_value_date: '06/13/2025',
        net_asset_value: '1.01654803794770000',
        assets_under_management: '12165140.98716837796116030716880000',
        fund_name: 'ONe',
        fund_id: 1,
      },
      {
        net_asset_value_date: '06/12/2025',
        net_asset_value: '1.01607457589505000',
        assets_under_management: '12159421.51526390254394172217410000',
        fund_name: 'ONe',
        fund_id: 1,
      },
    ])
    .persist()
