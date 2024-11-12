import nock from 'nock'

export const mockResponseSuccess = (): nock.Scope =>
  nock('https://api.stage.dydx.exchange/v3/price', {
    encodedQueryParams: true,
  })
    .post('', {
      starkKey: '0x1895a6a77ae14e7987b9cb51329a5adfb17bd8e7c638f92d6892d76e51cebcf',
      timestamp: 1577836800,
      price: '11512340000000000000000',
      assetName: 'BTCUSD',
      oracleName: 'Maker',
      signatureR: '0x6a7a118a6fa508c4f0eb77ea0efbc8d48a64d4a570d93f5c61cd886877cb920',
      signatureS: '0x6de9006a7bbf610d583d514951c98d15b1a0f6c78846986491d2c8ca049fd55',
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
