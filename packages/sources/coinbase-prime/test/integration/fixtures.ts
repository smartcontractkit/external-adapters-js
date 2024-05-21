import nock from 'nock'

export const mockBalancesResponseSuccess = (): nock.Scope =>
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

export const mockWalletsResponseSuccess = (): nock.Scope =>
  nock('https://api.prime.coinbase.com', {
    encodedQueryParams: true,
  })
    .get('/v1/portfolios/abcd1234-123a-1234-ab12-12a34bcd56e7/wallets')
    .query({
      symbols: { '': 'BTC' }, // unusual notation due to array query param
      sort_direction: 'ASC',
      cursor: '',
      limit: 100,
      type: 'VAULT',
    })
    .reply(
      200,
      () => ({
        wallets: [
          {
            id: '1a1a1a1a-1a1a-1a1a-1a1a-1a1a1a1a1a1a',
            name: 'Wallet 1',
            symbol: 'BTC',
            type: 'VAULT',
            created_at: '2024-03-26T18:12:48.219Z',
            address: 'bc1234567890123456789012345678901234567890',
          },
          {
            id: '2b2b2b2b-2b2b-2b2b-2b2b-2b2b2b2b2b2b',
            name: 'Wallet 2',
            symbol: 'BTC',
            type: 'VAULT',
            created_at: '2024-03-27T18:12:48.219Z',
            address: 'bc0987654321098765432109876543210987654321',
          },
        ],
        pagination: {
          has_next: false,
          next_cursor: '',
          sort_direction: 'ASC',
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
