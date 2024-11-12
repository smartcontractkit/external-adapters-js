import nock from 'nock'

export const mockResponseSuccess = (): nock.Scope =>
  nock('http://localhost:8545', {})
    .persist()
    .post('/', {
      id: '1',
      data: {
        addresses: ['39e7mxbeNmRRnjfy1qkphv1TiMcztZ8VuE', '35ULMyVnFoYaPaMxwHTRmaGdABpAThM4QR'],
        minConfirmations: 6,
      },
    })
    .reply(200, () => ({ data: { totalReserves: '24242' } }), [
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
