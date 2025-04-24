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

export const mockResponseZeusMinerFeeSuccess = () =>
  nock('http://localhost:8546')
    .persist()
    .get('/')
    .reply(
      200,
      () => ({
        minerFees: 0.01083,
        lastUpdatedAt: '2025-04-24T08:05:37.400942Z',
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

// nock('http://localhost:8546')
//       .persist()
//       .get('/')
//       .reply(200, { message: 'Success' })
//       .on('request', (req) => {
//         console.log('Intercepted request:', req)
//       })
