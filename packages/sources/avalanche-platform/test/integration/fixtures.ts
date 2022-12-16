import nock from 'nock'

export const mockBalanceSuccess = (): nock.Scope =>
  nock('http://localhost:3500')
    .post('/ext/bc/P', {
      jsonrpc: '2.0',
      method: 'platform.getCurrentValidators',
      params: {
        nodeIDs: [
          'NodeID-4gPY8c21HFsLjRm3nCUS3KA8WZsEsqEKC',
          'NodeID-F823qVX3w3sVb6EWKnTFvfhnmTCCX91gX',
        ],
      },
      id: '1',
    })
    .reply(
      200,
      {
        jsonrpc: '2.0',
        result: {
          validators: [
            {
              txID: 'taPBfrrqdXnGNde21ckvd5Rr5zFkfnGs5t5MSii9jVpd2EN5P',
              startTime: '1645162810',
              endTime: '167108277600',
              stakeAmount: '2000000000',
              nodeID: 'NodeID-4gPY8c21HFsLjRm3nCUS3KA8WZsEsqEKC',
              rewardOwner: {
                locktime: '0',
                threshold: '1',
                addresses: ['P-fuji16mluftw2xl8vusmuup9mgp24ghkjc6u85523zw'],
              },
              validationRewardOwner: {
                locktime: '0',
                threshold: '1',
                addresses: ['P-fuji16mluftw2xl8vusmuup9mgp24ghkjc6u85523zw'],
              },
              delegationRewardOwner: {
                locktime: '0',
                threshold: '1',
                addresses: ['P-fuji16mluftw2xl8vusmuup9mgp24ghkjc6u85523zw'],
              },
              potentialReward: '182188941',
              delegationFee: '2.0000',
              uptime: '0.0012',
              connected: false,
              delegators: null,
            },
            {
              txID: 'vB3taDDmFdS1qxLasZvCpqTfUja7jZNfPzTARYLShpSwtJcnq',
              startTime: '1',
              endTime: '1',
              stakeAmount: '1009000000',
              nodeID: 'NodeID-F823qVX3w3sVb6EWKnTFvfhnmTCCX91gX',
              rewardOwner: {
                locktime: '0',
                threshold: '1',
                addresses: ['P-fuji100vvz8u2jf6g62twwxpd0qguqtaeyt2yru2aes'],
              },
              validationRewardOwner: {
                locktime: '0',
                threshold: '1',
                addresses: ['P-fuji100vvz8u2jf6g62twwxpd0qguqtaeyt2yru2aes'],
              },
              delegationRewardOwner: {
                locktime: '0',
                threshold: '1',
                addresses: ['P-fuji100vvz8u2jf6g62twwxpd0qguqtaeyt2yru2aes'],
              },
              potentialReward: '7526406',
              delegationFee: '100.0000',
              uptime: '0.0001',
              connected: false,
              delegators: null,
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
