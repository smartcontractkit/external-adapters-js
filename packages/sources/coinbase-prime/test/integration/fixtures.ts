import nock from 'nock'

export const mockResponseSuccess = (): nock.Scope =>
  nock('https://api.prime.coinbase.com', {
    encodedQueryParams: true,
  })
    .get('/v1/portfolios/abcd1234-123a-1234-ab12-12a34bcd56e7/balances')
    .query({
      symbols: 'BTC',
      balance_type: 'TOTAL_BALANCES',
    })
    .reply(
      200,
      () => ({
        balances: [
          {
            symbol: 'btc',
            amount: '100.00',
            holds: '50.0',
            bonded_amount: '0.0',
            reserved_amount: '0.0',
            unbonding_amount: '0.0',
            unvested_amount: '0.0',
            pending_rewards_amount: '0.0',
            past_rewards_amount: '0.0',
            bondable_amount: '0.0',
            withdrawable_amount: '100.00',
            fiat_amount: '701889235.50',
          },
        ],
        type: 'TOTAL_BALANCES',
        trading_balances: {
          total: '0',
          holds: '0',
        },
        vault_balances: {
          total: '701889235.5',
          holds: '106683742.43',
        },
      }),
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
