import { EndpointContext } from '@chainlink/external-adapter-framework/adapter'
import { TransportDependencies } from '@chainlink/external-adapter-framework/transports'
import { LoggerFactoryProvider } from '@chainlink/external-adapter-framework/util'
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
  deriveSlxTokenAccountAddress,
  deriveVaultAddress,
  StslxExchangeRateTransport,
} from '../../src/transport/stslx-exchange-rate'

const originalEnv = { ...process.env }

const restoreEnv = () => {
  for (const key of Object.keys(process.env)) {
    if (key in originalEnv) {
      process.env[key] = originalEnv[key]
    } else {
      delete process.env[key]
    }
  }
}

const slxMintAddress = 'SLXdx4BUt2v9uJQNzWqSfzTJ9UKLUDsvxHFMEEdrfgq'
const stslxMintAddress = 'GxHksENo754dKj6kv5d2z7ey9KwE7YSRYgRCtoFYd2yq'
const glamStateAddress = '5E2scHi8LyZAqZeVHnXLeFhwoePxD2CTdSruWmjgVEoB'
const vaultAddress = 'GMwdh2jTdTrrhA7dMR7Cc2zC6gV38UePzAXeoFHrXnfH'
const slxTokenAccountAddress = '7CssRFNePpnDiCzjRC5kPRDpEJn87JMeDG7s6Gww9CTf'
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
  mintAddress = slxMintAddress,
  ownerAddress = vaultAddress,
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

const makeAccountInfoResponse = (data: string, owner = tokenProgramAddress) => ({
  value: {
    data: [data, 'base64'],
    owner,
  },
})

const getAccountInfoSendMock = jest.fn()
const getAccountInfoRequestMock = jest.fn()

const mockRpcRequests = () => {
  getAccountInfoRequestMock.mockImplementation((address: string, config: { encoding: string }) => ({
    send() {
      return getAccountInfoSendMock(address, config)
    },
  }))
}

const solanaRpc = makeStub('solanaRpc', {
  getAccountInfo: getAccountInfoRequestMock,
})

const createSolanaRpc = () => solanaRpc

jest.mock('@solana/rpc', () => ({
  createSolanaRpc() {
    return createSolanaRpc()
  },
}))

const log = jest.fn()
const logger = {
  fatal: log,
  error: log,
  warn: log,
  info: log,
  debug: log,
  trace: log,
  msgPrefix: 'mock-logger',
}

const loggerFactory = { child: () => logger }

LoggerFactoryProvider.set(loggerFactory)

describe('StslxExchangeRateTransport', () => {
  const transportName = 'default_single_transport'
  const endpointName = 'stslx-exchange-rate'
  const RPC_URL = 'https://solana.rpc.url'
  const BACKGROUND_EXECUTE_MS = 1500
  const slxBalance = 1_500_000_000n
  const stslxSupply = 1_000_000n
  const slxMintDecimals = 9
  const stslxMintDecimals = 6
  const expectedRate = (
    (slxBalance * 10n ** BigInt(18 + stslxMintDecimals)) /
    (stslxSupply * 10n ** BigInt(slxMintDecimals))
  ).toString()

  const adapterSettings = makeStub('adapterSettings', {
    RPC_URL,
    SOLANA_COMMITMENT: 'finalized',
    WARMUP_SUBSCRIPTION_TTL: 10_000,
    BACKGROUND_EXECUTE_MS,
    MAX_COMMON_KEY_SIZE: 300,
  } as unknown as BaseEndpointTypes['Settings'])

  const context = makeStub('context', {
    adapterSettings,
  } as EndpointContext<BaseEndpointTypes>)

  const responseCache = {
    write: jest.fn(),
  }

  const dependencies = makeStub('dependencies', {
    responseCache,
    subscriptionSetFactory: {
      buildSet: jest.fn(),
    },
  } as unknown as TransportDependencies<BaseEndpointTypes>)

  const param = makeStub('param', {
    endpoint: 'stslx-exchange-rate',
    glamStateAddress,
  })

  let transport: StslxExchangeRateTransport

  const mockValidAccountData = () => {
    getAccountInfoSendMock.mockImplementation((address: string) => {
      if (address === slxMintAddress) {
        return makeAccountInfoResponse(encodeMint(100_000_000_000n, slxMintDecimals))
      }
      if (address === stslxMintAddress) {
        return makeAccountInfoResponse(
          encodeMint(stslxSupply, stslxMintDecimals),
          token2022ProgramAddress,
        )
      }
      if (address === slxTokenAccountAddress) {
        return makeAccountInfoResponse(encodeTokenAccount(slxBalance))
      }
      throw new Error(`Unexpected getAccountInfo address: ${address}`)
    })
  }

  beforeEach(async () => {
    restoreEnv()
    jest.resetAllMocks()
    mockRpcRequests()
    jest.useFakeTimers()

    transport = new StslxExchangeRateTransport()

    await transport.initialize(dependencies, adapterSettings, endpointName, transportName)
  })

  afterEach(() => {
    expect(log).not.toBeCalled()
  })

  describe('deriveVaultAddress', () => {
    it('should derive the expected GLAM vault PDA', () => {
      expect(deriveVaultAddress(glamStateAddress)).toBe(vaultAddress)
    })
  })

  describe('deriveSlxTokenAccountAddress', () => {
    it('should derive the expected GLAM SLX base-asset ATA', () => {
      expect(deriveSlxTokenAccountAddress(vaultAddress)).toBe(slxTokenAccountAddress)
    })
  })

  describe('backgroundHandler', () => {
    it('should sleep after handleRequest', async () => {
      const t0 = Date.now()
      let t1 = 0
      transport.backgroundHandler(context, []).then(() => {
        t1 = Date.now()
      })
      await jest.runAllTimersAsync()
      expect(t1 - t0).toBe(BACKGROUND_EXECUTE_MS)
    })
  })

  describe('handleRequest', () => {
    it('should cache exchange rate response', async () => {
      mockValidAccountData()

      await transport.handleRequest(param)

      const expectedResponse = {
        statusCode: 200,
        result: expectedRate,
        data: {
          result: expectedRate,
          decimals: 18,
          slxBalance: slxBalance.toString(),
          stslxSupply: stslxSupply.toString(),
          slxMintDecimals,
          stslxMintDecimals,
          glamStateAddress,
          vaultAddress,
          slxTokenAccountAddress,
        },
        timestamps: {
          providerDataRequestedUnixMs: Date.now(),
          providerDataReceivedUnixMs: Date.now(),
          providerIndicatedTimeUnixMs: undefined,
        },
      }

      expect(responseCache.write).toBeCalledWith(transportName, [
        {
          params: param,
          response: expectedResponse,
        },
      ])
      expect(responseCache.write).toBeCalledTimes(1)
    })
  })

  describe('_handleRequest', () => {
    it('should read the SLX base-asset ATA and return the normalized exchange rate', async () => {
      mockValidAccountData()

      const response = await transport._handleRequest(param)

      expect(response).toEqual({
        statusCode: 200,
        result: expectedRate,
        data: {
          result: expectedRate,
          decimals: 18,
          slxBalance: slxBalance.toString(),
          stslxSupply: stslxSupply.toString(),
          slxMintDecimals,
          stslxMintDecimals,
          glamStateAddress,
          vaultAddress,
          slxTokenAccountAddress,
        },
        timestamps: {
          providerDataRequestedUnixMs: Date.now(),
          providerDataReceivedUnixMs: Date.now(),
          providerIndicatedTimeUnixMs: undefined,
        },
      })
      expect(getAccountInfoRequestMock).toBeCalledWith(slxTokenAccountAddress, {
        encoding: 'base64',
      })
    })

    it('should error when the stSLX mint has zero supply', async () => {
      mockValidAccountData()
      getAccountInfoSendMock.mockImplementation((address: string) => {
        if (address === slxMintAddress) {
          return makeAccountInfoResponse(encodeMint(100_000_000_000n, slxMintDecimals))
        }
        if (address === stslxMintAddress) {
          return makeAccountInfoResponse(encodeMint(0n, stslxMintDecimals), token2022ProgramAddress)
        }
        if (address === slxTokenAccountAddress) {
          return makeAccountInfoResponse(encodeTokenAccount(slxBalance))
        }
        throw new Error(`Unexpected getAccountInfo address: ${address}`)
      })

      await expect(transport._handleRequest(param)).rejects.toThrow('has zero supply')
    })

    it('should error when the derived SLX base-asset ATA is missing', async () => {
      mockValidAccountData()
      getAccountInfoSendMock.mockImplementation((address: string) => {
        if (address === slxMintAddress) {
          return makeAccountInfoResponse(encodeMint(100_000_000_000n, slxMintDecimals))
        }
        if (address === stslxMintAddress) {
          return makeAccountInfoResponse(
            encodeMint(stslxSupply, stslxMintDecimals),
            token2022ProgramAddress,
          )
        }
        if (address === slxTokenAccountAddress) {
          return { value: null }
        }
        throw new Error(`Unexpected getAccountInfo address: ${address}`)
      })

      await expect(transport._handleRequest(param)).rejects.toThrow('No account data found')
    })

    it('should error when the SLX base-asset ATA has the wrong mint', async () => {
      mockValidAccountData()
      getAccountInfoSendMock.mockImplementation((address: string) => {
        if (address === slxMintAddress) {
          return makeAccountInfoResponse(encodeMint(100_000_000_000n, slxMintDecimals))
        }
        if (address === stslxMintAddress) {
          return makeAccountInfoResponse(
            encodeMint(stslxSupply, stslxMintDecimals),
            token2022ProgramAddress,
          )
        }
        if (address === slxTokenAccountAddress) {
          return makeAccountInfoResponse(encodeTokenAccount(slxBalance, stslxMintAddress))
        }
        throw new Error(`Unexpected getAccountInfo address: ${address}`)
      })

      await expect(transport._handleRequest(param)).rejects.toThrow('mint to be')
    })

    it('should error when the SLX base-asset ATA has the wrong owner', async () => {
      mockValidAccountData()
      getAccountInfoSendMock.mockImplementation((address: string) => {
        if (address === slxMintAddress) {
          return makeAccountInfoResponse(encodeMint(100_000_000_000n, slxMintDecimals))
        }
        if (address === stslxMintAddress) {
          return makeAccountInfoResponse(
            encodeMint(stslxSupply, stslxMintDecimals),
            token2022ProgramAddress,
          )
        }
        if (address === slxTokenAccountAddress) {
          return makeAccountInfoResponse(
            encodeTokenAccount(slxBalance, slxMintAddress, PublicKey.default.toBase58()),
          )
        }
        throw new Error(`Unexpected getAccountInfo address: ${address}`)
      })

      await expect(transport._handleRequest(param)).rejects.toThrow('owner to be')
    })
  })
})
