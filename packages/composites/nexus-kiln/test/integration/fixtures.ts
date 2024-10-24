import nock from 'nock'

export const mockGraphQL = (): nock.Scope =>
  nock('https://api.studio.thegraph.com', {
    encodedQueryParams: true,
  })
    .persist()
    .post('/query/72419/enzyme-core/version/latest')
    .reply(
      200,
      () => ({
        data: {
          kilnStakingPositions: [
            {
              id: '0x1214fc85de7549ab363619ca01f2097ae040fe89',
              validators: [
                {
                  id: '0x8060ea0c0731fb559bfe0e6c801bc1b01ea94ba38ae7d7b9e2b53acc216fcc9210bb2d690dd31097a7832121d2e44093',
                },
              ],
            },
          ],
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

export const mockEthBalance = (): nock.Scope =>
  nock('http://fake-eth-balance-adapter-url', {
    encodedQueryParams: true,
  })
    .persist()
    .post('/')
    .reply(
      200,
      () => ({
        data: {
          result: [
            {
              address: 'A',
              balance: 100,
            },
          ],
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
