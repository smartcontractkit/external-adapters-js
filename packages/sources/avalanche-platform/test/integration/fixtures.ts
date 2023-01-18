import nock from 'nock'

export const mockBalanceSuccess = (): nock.Scope =>
  nock('http://localhost:3500')
    .post('/ext/bc/P', {
      jsonrpc: '2.0',
      method: 'platform.getBalance',
      params: {
        addresses: ['P-fuji1vd9sddlllrlk9fvj9lhntpw8t00lmvtnqkl2jt'],
      },
      id: '1',
    })
    .reply(
      200,
      {
        jsonrpc: '2.0',
        result: {
          balance: '1606136960057',
          unlocked: '1606136960057',
          lockedStakeable: '0',
          lockedNotStakeable: '0',
          balances: {
            U8iRqJoiJm8xZHAacmvYyZVwqQx6uDNtQeP3CQ6fcgQk3JqnK: '1606136960057',
          },
          unlockeds: {
            U8iRqJoiJm8xZHAacmvYyZVwqQx6uDNtQeP3CQ6fcgQk3JqnK: '1606136960057',
          },
          lockedStakeables: {},
          lockedNotStakeables: {},
          utxoIDs: [
            {
              txID: '2E9jBifwAKMajtgrwmJxwuW4UtYmTauAggCgRQv2wWF7PiXwgD',
              outputIndex: 1,
            },
            {
              txID: '2E9jBifwAKMajtgrwmJxwuW4UtYmTauAggCgRQv2wWF7PiXwgD',
              outputIndex: 0,
            },
          ],
        },
        id: '1',
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
