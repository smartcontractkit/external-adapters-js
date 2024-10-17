import nock from 'nock'

export const mockResponseSuccess = (): nock.Scope =>
  nock('https://fbtc.phalcon.blocksec.com/api/v1/extension/fbtc-reserved-addr', {
    encodedQueryParams: true,
  })
    .get('')
    .reply(
      200,
      () => ({
        total_records: 2,
        result: [
          {
            address: 'bc1qsdq75g6pmk6uz9a897pmgsmzr44822hg55adz8',
            address_type: 'BridgeDeposit_address',
            balance: 0,
          },
          {
            address: 'bc1qhu98nf6ddz6ja73rn72encdr8ezsyhexwpdzap0vcs7lg2wpmrnq5ygfsl',
            address_type: 'LockedFBTC1_address',
            balance: 100000,
          },
        ],
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
