import nock from 'nock'

export const mockResponseSuccess = (): nock.Scope =>
  nock('https://api.stage.dydx.exchange/v3/price', {
    encodedQueryParams: true,
  })
    .post('', {
      starkKey: '0x179d2c412b2e6f792d89855789c5bdebdefda05a728925f038763bab1b15834',
      timestamp: 1577836800,
      price: '11512340000000000000000',
      assetName: 'BTCUSD',
      oracleName: 'Maker',
      signatureR: '0x484fdd3bba498ddd9434878400e2c0113ce4ff6f1cd80fb600fab129b259d99',
      signatureS: '0x27929a4beebc73f52701476332a7e01cc71bdb641dbcc6bb881608273d684a8',
    })
    .reply(200, () => ({ market: 'BTCUSD', price: '27000' }), [
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
