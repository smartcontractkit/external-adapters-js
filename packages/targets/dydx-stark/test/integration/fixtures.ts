import nock from 'nock'

export const mockResponseSuccess = (): nock.Scope =>
  nock('https://api.stage.dydx.exchange/v3/price', {
    encodedQueryParams: true,
  })
    .post(
      '',
      (body: Record<string, unknown>) =>
        body.oracleName === 'Maker' &&
        body.assetName === 'BTCUSD' &&
        body.timestamp === 1577836800 &&
        body.price === '11512340000000000000000' &&
        typeof body.starkKey === 'string' &&
        body.starkKey.startsWith('0x') &&
        typeof body.signatureR === 'string' &&
        body.signatureR.startsWith('0x') &&
        typeof body.signatureS === 'string' &&
        body.signatureS.startsWith('0x'),
    )
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
