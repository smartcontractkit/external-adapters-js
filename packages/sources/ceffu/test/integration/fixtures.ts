import nock from 'nock'

export const mockResponseSuccess = (): nock.Scope =>
  nock('https://open-api.ceffu.com')
    .get('/open-api/v1/mirrorX/positions/list')
    .query(true)
    .reply(200, () => ({ data: { exchangeBalance: '100.0' }, code: '123', message: 'ok' }), [
      'Content-Type',
      'application/json',
      'Connection',
      'close',
      'Vary',
      'Accept-Encoding',
      'Vary',
      'Origin',
    ])
    .persist()

export const mockWalletListResponseSuccess = (): nock.Scope =>
  nock('https://open-api.ceffu.com')
    .get('/open-api/v1/wallet/list')
    .query(true)
    .reply(
      200,
      () => ({
        data: { data: [{ walletIdStr: 'w1' }, { walletIdStr: 'w2' }], totalPage: 1, pageNo: 1 },
        code: '000000',
        message: 'ok',
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

export const mockWalletAssetResponseSuccess = (): nock.Scope =>
  nock('https://open-api.ceffu.com')
    .get('/open-api/v1/wallet/asset/list')
    .query((q) => q.walletId === 'w1')
    .reply(
      200,
      () => ({
        data: {
          data: [
            { coinSymbol: 'BTC', amount: '20' },
            { coinSymbol: 'ETH', amount: '30' },
          ],
          totalPage: 1,
          pageNo: 1,
        },
        code: '000000',
        message: 'ok',
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
    .get('/open-api/v1/wallet/asset/list')
    .query((q) => q.walletId === 'w2')
    .reply(
      200,
      () => ({
        data: {
          data: [
            { coinSymbol: 'BTC', amount: '2' },
            { coinSymbol: 'ETH', amount: '3' },
          ],
          totalPage: 1,
          pageNo: 1,
        },
        code: '000000',
        message: 'ok',
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
