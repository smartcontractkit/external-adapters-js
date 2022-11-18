import nock from 'nock'

export const mockBalanceSuccess = (): nock.Scope =>
  nock('http://localhost:3500', { encodedQueryParams: true })
    .get(
      '/eth/v1/beacon/states/finalized/validators?id=0x8bdb63ea991f42129d6defa8d3cc5926108232c89824ad50d57f49a0310de73e81e491eae6587bd1465fa5fd8e4dee21,0xb672b5976879c6423ad484ba4fa0e76069684eed8e2a8081f6730907f3618d43828d1b399d2fd22d7961824594f73462',
    )
    .reply(
      200,
      {
        execution_optimistic: true,
        data: [
          {
            index: '0',
            balance: '32081209325',
            status: 'active_ongoing',
            validator: {
              pubkey:
                '0x8bdb63ea991f42129d6defa8d3cc5926108232c89824ad50d57f49a0310de73e81e491eae6587bd1465fa5fd8e4dee21',
              withdrawal_credentials:
                '0x00f50428677c60f997aadeab24aabf7fceaef491c96a52b463ae91f95611cf71',
              effective_balance: '32000000000',
              slashed: false,
              activation_eligibility_epoch: '0',
              activation_epoch: '0',
              exit_epoch: '18446744073709551615',
              withdrawable_epoch: '18446744073709551615',
            },
          },
          {
            index: '1',
            balance: '32067790944',
            status: 'active_ongoing',
            validator: {
              pubkey:
                '0xb672b5976879c6423ad484ba4fa0e76069684eed8e2a8081f6730907f3618d43828d1b399d2fd22d7961824594f73462',
              withdrawal_credentials:
                '0x00f50428677c60f997aadeab24aabf7fceaef491c96a52b463ae91f95611cf71',
              effective_balance: '32000000000',
              slashed: false,
              activation_eligibility_epoch: '0',
              activation_epoch: '0',
              exit_epoch: '18446744073709551615',
              withdrawable_epoch: '18446744073709551615',
            },
          },
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
