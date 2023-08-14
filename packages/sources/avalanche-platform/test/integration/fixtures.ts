import nock from 'nock'

export const mockBalanceSuccess = (): nock.Scope =>
  nock('http://localhost:3500')
    .persist()
    .post('/ext/bc/P', {
      jsonrpc: '2.0',
      method: 'platform.getStake',
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
          staked: '2000000000000',
          stakeds: {
            U8iRqJoiJm8xZHAacmvYyZVwqQx6uDNtQeP3CQ6fcgQk3JqnK: '2000000000000',
          },
          stakedOutputs: [
            '0x000021e67317cbc4be2aeb00677ad6462778a8f52274b9d605df2591b23027a87dff00000007000001d1a94a200000000000000000000000000100000001737eefad3f40b3b87736c0fa8d91e0845091ad8f7a73fe74',
          ],
          encoding: 'hex',
        },
        id: 2,
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
    .persist()
