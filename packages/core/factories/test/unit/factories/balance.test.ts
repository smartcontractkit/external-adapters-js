import { AdapterError } from '@chainlink/ea-bootstrap'
import { Account } from '@chainlink/ea-bootstrap'
import { balance } from '../../../src/index'

const account: Account = {
  address: '0x1234',
  chain: 'random',
  coin: 'USDT',
}

const accountWithBalance = {
  ...account,
  balance: '1234.1234',
}

const makeTestEndpoint = (result: Account[]) =>
  balance.make({
    getBalance: async () => ({
      result,
    }),
    isSupported: () => true,
  })

describe('balance execute factory tests', () => {
  it('uses getBalance function to fetch balance for account', async () => {
    const response = await makeTestEndpoint([accountWithBalance])(
      {
        id: '1',
        data: {
          dataPath: 'addresses',
          addresses: [account],
        },
      },
      {},
    )

    expect(response).toEqual({
      jobRunID: '1',
      data: {
        result: [accountWithBalance],
      },
      result: [accountWithBalance],
      statusCode: 200,
    })
  })

  it('throws adapter error if resultPath is invalid', () => {
    expect(
      async () =>
        await makeTestEndpoint([accountWithBalance])(
          {
            id: '1',
            data: {
              dataPath: 'asd',
            },
          },
          {},
        ),
    ).rejects.toThrow(AdapterError)
  })

  it('throws adapter error if account does not have an address', () => {
    expect(
      async () =>
        await makeTestEndpoint([accountWithBalance])(
          {
            id: '1',
            data: {
              result: [{}],
            },
          },
          {},
        ),
    ).rejects.toThrow(AdapterError)
  })

  it('fills default chain and coin', async () => {
    const account = {
      address: '0x1234',
    }

    const expected = {
      ...account,
      coin: 'btc',
      chain: 'mainnet',
    }

    const withBalance = {
      ...expected,
      balance: '1234.1234',
    }

    const endpoint = balance.make({
      getBalance: async (input) => {
        expect(input).toEqual(expected)

        return {
          result: [withBalance],
        }
      },
      isSupported: () => true,
    })

    const response = await endpoint(
      {
        id: '1',
        data: {
          dataPath: 'addresses',
          addresses: [account],
        },
      },
      {},
    )

    expect(response).toEqual({
      jobRunID: '1',
      data: {
        result: [withBalance],
      },
      result: [withBalance],
      statusCode: 200,
    })
  })

  it('returns expected response for unsupported coin-network pair', async () => {
    const endpoint = balance.make({
      getBalance: async () => ({
        result: [accountWithBalance],
      }),
      isSupported: () => false,
    })

    const response = await endpoint(
      {
        id: '1',
        data: {
          dataPath: 'addresses',
          addresses: [account],
        },
      },
      {},
    )

    const expectedAccount = {
      ...account,
      warning: `No Operation: this provider does not support ${account.chain} ${account.coin}`,
    }

    expect(response).toEqual({
      jobRunID: '1',
      data: {
        result: [expectedAccount],
      },
      result: [expectedAccount],
      statusCode: 200,
    })
  })

  // TODO: Should be handled by more restrictive typing
  it('fails if no config is provided', () => {
    expect(async () => {
      const endpoint = balance.make()
      await endpoint(
        {
          id: '1',
          data: {
            dataPath: 'addresses',
            addresses: [account],
          },
        },
        {},
      )
    }).rejects.toThrow(Error)
  })
})
