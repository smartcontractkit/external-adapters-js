import nock from 'nock'

export const mockBalanceSuccess = (): nock.Scope =>
  nock('http://localhost:3500', { encodedQueryParams: true })
    .get(
      '/eth/v1/beacon/states/finalized/validator_balances?id=0x8bdb63ea991f42129d6defa8d3cc5926108232c89824ad50d57f49a0310de73e81e491eae6587bd1465fa5fd8e4dee21,0xb672b5976879c6423ad484ba4fa0e76069684eed8e2a8081f6730907f3618d43828d1b399d2fd22d7961824594f73462',
    )
    .reply(
      200,
      {
        execution_optimistic: true,
        data: [
          { index: '416512', balance: '32081209325' },
          { index: '416580', balance: '32067790944' },
        ],
      },
      [
        'content-type',
        'application/json',
        'server',
        'Lighthouse/v3.1.0-aa022f4/x86_64-linux',
        'content-length',
        '124',
        'date',
        'Wed, 21 Sep 2022 10:58:34 GMT',
      ],
    )
