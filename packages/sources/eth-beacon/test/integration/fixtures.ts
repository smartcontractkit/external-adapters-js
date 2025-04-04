import nock from 'nock'

export const mockBalanceSuccess = (): nock.Scope =>
  nock('http://localhost:3500', { encodedQueryParams: true })
    .persist()
    .post('/eth/v1/beacon/states/finalized/validators', {
      ids: [
        '0x8bdb63ea991f42129d6defa8d3cc5926108232c89824ad50d57f49a0310de73e81e491eae6587bd1465fa5fd8e4dee21',
        '0xb672b5976879c6423ad484ba4fa0e76069684eed8e2a8081f6730907f3618d43828d1b399d2fd22d7961824594f73462',
      ],
    })
    .reply(
      200,
      {
        execution_optimistic: true,
        data: [
          {
            index: '416512',
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
            index: '416580',
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
    .persist()

export const mockBalanceWithStatusSuccess = (): void => {
  nock('http://localhost:3500', { encodedQueryParams: true })
    .persist()
    .post('/eth/v1/beacon/states/finalized/validators', {
      ids: [
        '0x8bdb63ea991f42129d6defa8d3cc5926108232c89824ad50d57f49a0310de73e81e491eae6587bd1465fa5fd8e4dee21',
        '0xb672b5976879c6423ad484ba4fa0e76069684eed8e2a8081f6730907f3618d43828d1b399d2fd22d7961824594f73462',
        '0x000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000',
      ],
      statuses: ['active'],
    })
    .reply(
      200,
      {
        execution_optimistic: true,
        data: [
          {
            index: '416512',
            balance: '32081209325',
            status: 'active_ongoing',
            validator: {
              pubkey:
                '0x8bdb63ea991f42129d6defa8d3cc5926108232c89824ad50d57f49a0310de73e81e491eae6587bd1465fa5fd8e4dee21',
              withdrawal_credentials:
                '0x010000000000000000000000e0c8df4270f4342132ec333f6048cb703e7a9c77',
              effective_balance: '32000000000',
              slashed: false,
              activation_eligibility_epoch: '142627',
              activation_epoch: '142641',
              exit_epoch: '18446744073709551615',
              withdrawable_epoch: '18446744073709551615',
            },
          },
          {
            index: '416580',
            balance: '32067790944',
            status: 'active_ongoing',
            validator: {
              pubkey:
                '0xb672b5976879c6423ad484ba4fa0e76069684eed8e2a8081f6730907f3618d43828d1b399d2fd22d7961824594f73462',
              withdrawal_credentials:
                '0x010000000000000000000000e0c8df4270f4342132ec333f6048cb703e7a9c77',
              effective_balance: '32000000000',
              slashed: false,
              activation_eligibility_epoch: '143203',
              activation_epoch: '143209',
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
    .persist()
}

export const mockGetEthDepositContract = (): void => {
  nock('http://localhost:3500')
    .get('/eth/v1/config/deposit_contract')
    .reply(200, { data: { chain_id: '5', address: '0x8c5fecdc472e27bc447696f431e425d02dd46a8c' } })
    .persist()
}

export const mockBalanceLimboValidator = (): void => {
  nock('http://localhost:3500', { encodedQueryParams: true })
    .post('/eth/v1/beacon/states/finalized/validators', {
      ids: [
        '0x8bdb63ea991f42129d6defa8d3cc5926108232c89824ad50d57f49a0310de73e81e491eae6587bd1465fa5fd8e4dee21',
        '0xb672b5976879c6423ad484ba4fa0e76069684eed8e2a8081f6730907f3618d43828d1b399d2fd22d7961824594f73462',
        '0x98416f837d457d72f0dd5297898e1225a1e7731c2579f642626fbdc8ee8ce4f1e89ca538b72d5c3b75fdd1e9e10c87c6',
      ],
    })
    .reply(
      200,
      {
        execution_optimistic: true,
        data: [
          {
            index: '416512',
            balance: '32081209325',
            status: 'active_ongoing',
            validator: {
              pubkey:
                '0x8bdb63ea991f42129d6defa8d3cc5926108232c89824ad50d57f49a0310de73e81e491eae6587bd1465fa5fd8e4dee21',
              withdrawal_credentials:
                '0x010000000000000000000000e0c8df4270f4342132ec333f6048cb703e7a9c77',
              effective_balance: '32000000000',
              slashed: false,
              activation_eligibility_epoch: '142627',
              activation_epoch: '142641',
              exit_epoch: '18446744073709551615',
              withdrawable_epoch: '18446744073709551615',
            },
          },
          {
            index: '416580',
            balance: '32067790944',
            status: 'active_ongoing',
            validator: {
              pubkey:
                '0xb672b5976879c6423ad484ba4fa0e76069684eed8e2a8081f6730907f3618d43828d1b399d2fd22d7961824594f73462',
              withdrawal_credentials:
                '0x010000000000000000000000e0c8df4270f4342132ec333f6048cb703e7a9c77',
              effective_balance: '32000000000',
              slashed: false,
              activation_eligibility_epoch: '143203',
              activation_epoch: '143209',
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
    .persist()
}

// Mocks responses for the given addresses, batched into batches of 3.
// Returns an array of request objects which can be used to check if the
// request has happened and to resolve the request.
export const mockBalanceBatchedAddresses = (addresses: string[]): void => {
  const batchSize = 3
  const requests: {
    hasHappened: boolean
    resolve: () => void
  }[] = []

  const mockAddresses = (startIndex, endIndex) => {
    const addressesToMock = addresses.slice(startIndex, endIndex)
    let resolve
    const waitBeforeResolving = new Promise((r) => {
      resolve = r
    })
    const request = {
      hasHappened: false,
      resolve,
    }
    requests.push(request)
    nock('http://localhost:3500', { encodedQueryParams: true })
      .persist()
      .post('/eth/v1/beacon/states/finalized/validators', {
        ids: addressesToMock,
      })
      .reply(
        200,
        async () => {
          request.hasHappened = true
          await waitBeforeResolving
          return {
            execution_optimistic: true,
            data: addressesToMock.map((address, addressIndex) => ({
              index: (416512 + startIndex + addressIndex).toString(),
              balance: (32081209325 + startIndex + addressIndex).toString(),
              status: 'active_ongoing',
              validator: {
                pubkey: address,
                withdrawal_credentials:
                  '0x00f50428677c60f997aadeab24aabf7fceaef491c96a52b463ae91f95611cf71',
                effective_balance: '32000000000',
                slashed: false,
                activation_eligibility_epoch: '0',
                activation_epoch: '0',
                exit_epoch: '18446744073709551615',
                withdrawable_epoch: '18446744073709551615',
              },
            })),
          }
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
  }

  for (let batch = 0; batch < Math.ceil(addresses.length / batchSize); batch++) {
    const start = batch * batchSize
    const end = start + batchSize
    mockAddresses(start, end)
  }
  return requests
}
