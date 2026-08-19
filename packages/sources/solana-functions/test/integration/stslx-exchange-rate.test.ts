import {
  TestAdapter,
  makeStub,
  setEnvVariables,
} from '@chainlink/external-adapter-framework/util/testing-utils'
import {
  AccountLayout,
  MintLayout,
  TOKEN_2022_PROGRAM_ID,
  TOKEN_PROGRAM_ID,
} from '@solana/spl-token'
import { PublicKey } from '@solana/web3.js'

const slxMintAddress = 'SLXdx4BUt2v9uJQNzWqSfzTJ9UKLUDsvxHFMEEdrfgq'
const stslxMintAddress = 'GxHksENo754dKj6kv5d2z7ey9KwE7YSRYgRCtoFYd2yq'
const vaultAddress = 'GMwdh2jTdTrrhA7dMR7Cc2zC6gV38UePzAXeoFHrXnfH'
const slxTokenAccountAddress = '7CssRFNePpnDiCzjRC5kPRDpEJn87JMeDG7s6Gww9CTf'
const minRate = '1000000000000000000'
const maxRate = '2000000000000000000'
const slxBalance = 1_500_000_000n
const stslxSupply = 1_000_000n
const tokenProgramAddress = TOKEN_PROGRAM_ID.toBase58()
const token2022ProgramAddress = TOKEN_2022_PROGRAM_ID.toBase58()

const encodeMint = (supply: bigint, decimals: number) => {
  const buffer = Buffer.alloc(MintLayout.span)
  MintLayout.encode(
    {
      mintAuthorityOption: 0,
      mintAuthority: PublicKey.default,
      supply,
      decimals,
      isInitialized: true,
      freezeAuthorityOption: 0,
      freezeAuthority: PublicKey.default,
    },
    buffer,
  )

  return buffer.toString('base64')
}

const encodeTokenAccount = (amount: bigint) => {
  const buffer = Buffer.alloc(AccountLayout.span)
  AccountLayout.encode(
    {
      mint: new PublicKey(slxMintAddress),
      owner: new PublicKey(vaultAddress),
      amount,
      delegateOption: 0,
      delegate: PublicKey.default,
      state: 1,
      isNativeOption: 0,
      isNative: 0n,
      delegatedAmount: 0n,
      closeAuthorityOption: 0,
      closeAuthority: PublicKey.default,
    },
    buffer,
  )

  return buffer.toString('base64')
}

const makeAccountInfoResponse = (data: string, owner = tokenProgramAddress) => ({
  data: [data, 'base64'],
  owner,
})

const solanaRpc = makeStub('solanaRpc', {
  getMultipleAccounts: (addresses: string[]) => ({
    async send() {
      const accountsByAddress: Record<string, ReturnType<typeof makeAccountInfoResponse>> = {
        [slxMintAddress]: makeAccountInfoResponse(encodeMint(100_000_000_000n, 9)),
        [stslxMintAddress]: makeAccountInfoResponse(
          encodeMint(stslxSupply, 6),
          token2022ProgramAddress,
        ),
        [slxTokenAccountAddress]: makeAccountInfoResponse(encodeTokenAccount(slxBalance)),
      }

      return {
        value: addresses.map((address) => accountsByAddress[address] ?? null),
      }
    },
  }),
})

const createSolanaRpc = () => solanaRpc

jest.mock('@solana/rpc', () => ({
  createSolanaRpc() {
    return createSolanaRpc()
  },
}))

describe('execute', () => {
  let spy: jest.SpyInstance
  let testAdapter: TestAdapter
  let oldEnv: NodeJS.ProcessEnv

  beforeAll(async () => {
    oldEnv = JSON.parse(JSON.stringify(process.env))
    process.env.RPC_URL = 'solana.rpc.url'
    process.env.BACKGROUND_EXECUTE_MS = process.env.BACKGROUND_EXECUTE_MS ?? '0'
    const mockDate = new Date('2001-01-01T11:11:11.111Z')
    spy = jest.spyOn(Date, 'now').mockReturnValue(mockDate.getTime())

    const adapter = (await import('./../../src')).adapter
    adapter.rateLimiting = undefined
    testAdapter = await TestAdapter.startWithMockedCache(adapter, {
      testAdapter: {} as TestAdapter<never>,
    })
  })

  afterAll(async () => {
    setEnvVariables(oldEnv)
    await testAdapter.api.close()
    spy.mockRestore()
  })

  describe('stslx-exchange-rate', () => {
    it('should return success', async () => {
      const data = {
        endpoint: 'stslx-exchange-rate',
        minRate,
        maxRate,
      }
      const response = await testAdapter.request(data)
      expect(response.statusCode).toBe(200)
      expect(response.json()).toEqual({
        data: {
          boundsApplied: false,
          computedResult: '1500000000000000000',
          decimals: 18,
          result: '1500000000000000000',
          slxBalance: slxBalance.toString(),
          stslxSupply: stslxSupply.toString(),
        },
        result: '1500000000000000000',
        statusCode: 200,
        timestamps: {
          providerDataReceivedUnixMs: 978347471111,
          providerDataRequestedUnixMs: 978347471111,
        },
      })
    })

    it('should return success when bounds are omitted', async () => {
      const response = await testAdapter.request({
        endpoint: 'stslx-exchange-rate',
      })

      expect(response.statusCode).toBe(200)
      expect(response.json().data.boundsApplied).toBe(false)
      expect(response.json().result).toBe('1500000000000000000')
    })

    it('should reject inverted bounds', async () => {
      const response = await testAdapter.request({
        endpoint: 'stslx-exchange-rate',
        minRate: maxRate,
        maxRate: minRate,
      })

      expect(response.statusCode).toBe(400)
      expect(response.json()).toEqual({
        error: {
          message: 'minRate must be less than or equal to maxRate',
          name: 'AdapterError',
        },
        status: 'errored',
        statusCode: 400,
      })
    })
  })
})
