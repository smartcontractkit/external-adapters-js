import { TransportDependencies } from '@chainlink/external-adapter-framework/transports'
import { makeStub } from '@chainlink/external-adapter-framework/util/testing-utils'
import {
  AccountLayout,
  MintLayout,
  TOKEN_2022_PROGRAM_ID,
  TOKEN_PROGRAM_ID,
} from '@solana/spl-token'
import { PublicKey } from '@solana/web3.js'
import { BaseEndpointTypes } from '../../src/endpoint/stslx-exchange-rate'
import {
  GLAM_VAULT_ADDRESS,
  SLX_MINT_ADDRESS,
  SLX_TOKEN_ACCOUNT_ADDRESS,
  STSLX_MINT_ADDRESS,
  StslxExchangeRateTransport,
} from '../../src/transport/stslx-exchange-rate'

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

const encodeTokenAccount = (
  amount: bigint,
  mintAddress = SLX_MINT_ADDRESS,
  ownerAddress = GLAM_VAULT_ADDRESS,
) => {
  const buffer = Buffer.alloc(AccountLayout.span)
  AccountLayout.encode(
    {
      mint: new PublicKey(mintAddress),
      owner: new PublicKey(ownerAddress),
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

const makeAccountInfo = (data: string, owner = tokenProgramAddress) => ({
  data: [data, 'base64'],
  owner,
})

const getMultipleAccountsSendMock = jest.fn()
const getMultipleAccountsRequestMock = jest.fn()

const mockRpcRequests = () => {
  getMultipleAccountsRequestMock.mockImplementation(
    (addresses: string[], config: { encoding: string }) => ({
      send() {
        return getMultipleAccountsSendMock(addresses, config)
      },
    }),
  )
}

const solanaRpc = makeStub('solanaRpc', {
  getMultipleAccounts: getMultipleAccountsRequestMock,
})

const createSolanaRpc = () => solanaRpc

jest.mock('@solana/rpc', () => ({
  createSolanaRpc() {
    return createSolanaRpc()
  },
}))

describe('StslxExchangeRateTransport', () => {
  const transportName = 'default_single_transport'
  const endpointName = 'stslx-exchange-rate'
  const RPC_URL = 'https://solana.rpc.url'
  const slxBalance = 1_500_000_000n
  const stslxSupply = 1_000_000n
  const slxMintDecimals = 9
  const stslxMintDecimals = 6
  const minRate = '1000000000000000000'
  const maxRate = '2000000000000000000'
  const expectedRate = '1500000000000000000'

  const adapterSettings = makeStub('adapterSettings', {
    RPC_URL,
    SOLANA_COMMITMENT: 'finalized',
    WARMUP_SUBSCRIPTION_TTL: 10_000,
    BACKGROUND_EXECUTE_MS: 1500,
    MAX_COMMON_KEY_SIZE: 300,
  } as unknown as BaseEndpointTypes['Settings'])

  const dependencies = makeStub('dependencies', {
    responseCache: { write: jest.fn() },
    subscriptionSetFactory: {
      buildSet: jest.fn(),
    },
  } as unknown as TransportDependencies<BaseEndpointTypes>)

  const param = makeStub('param', {
    endpoint: 'stslx-exchange-rate',
    minRate,
    maxRate,
  })

  let transport: StslxExchangeRateTransport

  type AccountInfo = ReturnType<typeof makeAccountInfo> | null

  const mockAccountData = (overrides: Record<string, AccountInfo> = {}) => {
    const accountsByAddress: Record<string, AccountInfo> = {
      [SLX_MINT_ADDRESS]: makeAccountInfo(encodeMint(100_000_000_000n, slxMintDecimals)),
      [STSLX_MINT_ADDRESS]: makeAccountInfo(
        encodeMint(stslxSupply, stslxMintDecimals),
        token2022ProgramAddress,
      ),
      [SLX_TOKEN_ACCOUNT_ADDRESS]: makeAccountInfo(encodeTokenAccount(slxBalance)),
      ...overrides,
    }

    getMultipleAccountsSendMock.mockImplementation((addresses: string[]) => ({
      value: addresses.map((address) => accountsByAddress[address] ?? null),
    }))
  }

  beforeEach(async () => {
    jest.resetAllMocks()
    mockRpcRequests()

    transport = new StslxExchangeRateTransport()

    await transport.initialize(dependencies, adapterSettings, endpointName, transportName)
  })

  describe('_handleRequest', () => {
    it('should read all accounts atomically and return the normalized exchange rate', async () => {
      mockAccountData()

      const response = await transport._handleRequest(param)

      expect(response).toEqual({
        statusCode: 200,
        result: expectedRate,
        data: {
          result: expectedRate,
          computedResult: expectedRate,
          decimals: 18,
          minRate,
          maxRate,
          boundsApplied: false,
        },
        timestamps: {
          providerDataRequestedUnixMs: expect.any(Number),
          providerDataReceivedUnixMs: expect.any(Number),
          providerIndicatedTimeUnixMs: undefined,
        },
      })
      expect(getMultipleAccountsRequestMock).toBeCalledWith(
        [SLX_MINT_ADDRESS, STSLX_MINT_ADDRESS, SLX_TOKEN_ACCOUNT_ADDRESS],
        { encoding: 'base64' },
      )
    })

    it('should clamp the exchange rate to minRate', async () => {
      mockAccountData()
      const minClampedRate = (BigInt(expectedRate) + 1n).toString()

      const response = await transport._handleRequest({
        ...param,
        minRate: minClampedRate,
      })

      expect(response.result).toBe(minClampedRate)
      expect(response.data?.result).toBe(minClampedRate)
      expect(response.data?.computedResult).toBe(expectedRate)
      expect(response.data?.boundsApplied).toBe(true)
    })

    it('should clamp the exchange rate to maxRate', async () => {
      mockAccountData()
      const maxClampedRate = (BigInt(expectedRate) - 1n).toString()

      const response = await transport._handleRequest({
        ...param,
        maxRate: maxClampedRate,
      })

      expect(response.result).toBe(maxClampedRate)
      expect(response.data?.result).toBe(maxClampedRate)
      expect(response.data?.computedResult).toBe(expectedRate)
      expect(response.data?.boundsApplied).toBe(true)
    })

    it('should error when rate bounds are invalid', async () => {
      await expect(
        transport._handleRequest({
          ...param,
          minRate: maxRate,
          maxRate: minRate,
        }),
      ).rejects.toThrow('minRate must be less than or equal to maxRate')

      await expect(
        transport._handleRequest({
          ...param,
          minRate: '0',
        }),
      ).rejects.toThrow('minRate must be a positive base-10 integer string')

      await expect(
        transport._handleRequest({
          ...param,
          maxRate: 'not-a-rate',
        }),
      ).rejects.toThrow('maxRate must be a positive base-10 integer string')
    })

    it('should error when the stSLX mint has zero supply', async () => {
      mockAccountData({
        [STSLX_MINT_ADDRESS]: makeAccountInfo(
          encodeMint(0n, stslxMintDecimals),
          token2022ProgramAddress,
        ),
      })

      await expect(transport._handleRequest(param)).rejects.toThrow('has zero supply')
    })

    it('should error when the derived SLX base-asset ATA is missing', async () => {
      mockAccountData({
        [SLX_TOKEN_ACCOUNT_ADDRESS]: null,
      })

      await expect(transport._handleRequest(param)).rejects.toThrow(
        `Expected SLX token account '${SLX_TOKEN_ACCOUNT_ADDRESS}' to be owned by the legacy SPL Token program`,
      )
    })

    it('should error when the SLX base-asset ATA has the wrong mint', async () => {
      mockAccountData({
        [SLX_TOKEN_ACCOUNT_ADDRESS]: makeAccountInfo(
          encodeTokenAccount(slxBalance, STSLX_MINT_ADDRESS),
        ),
      })

      await expect(transport._handleRequest(param)).rejects.toThrow('mint to be')
    })

    it('should error when the SLX base-asset ATA has the wrong owner', async () => {
      mockAccountData({
        [SLX_TOKEN_ACCOUNT_ADDRESS]: makeAccountInfo(
          encodeTokenAccount(slxBalance, SLX_MINT_ADDRESS, PublicKey.default.toBase58()),
        ),
      })

      await expect(transport._handleRequest(param)).rejects.toThrow('owner to be')
    })
  })
})
