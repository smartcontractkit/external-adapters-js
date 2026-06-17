import { EndpointContext } from '@chainlink/external-adapter-framework/adapter'
import { TransportDependencies } from '@chainlink/external-adapter-framework/transports'
import { LoggerFactoryProvider } from '@chainlink/external-adapter-framework/util'
import { makeStub } from '@chainlink/external-adapter-framework/util/testing-utils'
import { MintLayout, TOKEN_PROGRAM_ID } from '@solana/spl-token'
import { PublicKey } from '@solana/web3.js'
import { BaseEndpointTypes } from '../../src/endpoint/strcusx-exchange-rate'
import {
  deriveAccountingAddress,
  deriveControllerAddress,
  deriveJuniorMintAddress,
  deriveSeniorMintAddress,
  deriveStrategyAddress,
  StrcusxExchangeRateTransport,
} from '../../src/transport/strcusx-exchange-rate'

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

const programAddress = '7iNvMc3x5VvwNmYomAAg86CpWeEw7QfDF2z5GgtDzHXe'
const strategyName = 'STRC-USX-1'
const controllerAddress = 'DChEFFUoGXeZgh4Mivq7gR8mW5DQi7yMaQ1naqmnxB3q'
const strategyAddress = 'AT57KkNUMM3UeVwQmvTL8undUkFKYYRigtsCToxfpP1o'
const accountingAddress = '31vVMMVrketFGG9s25PxtQzm8HsAkqoSEoYuj4bXWcVn'
const assetMintAddress = '4ujhCkYxvGwdQnKRRzCjuVreThRAzY3k4n78iypNSQce'
const juniorMintAddress = 'Qc25hHS8uv2CEZUd9vC1sKBwsHgMdosF6KG6MsBavSd'
const seniorMintAddress = '4m1JrzTPgaKg1DwG19BotH4ZAUyrMzjmSDkGUr38YAai'
const assetVaultAddress = 'CPAUEk6XiZf4mvnWhEZZn1ojA3PyhTzDkovZX9sK6bgJ'
const vestingVaultAddress = '4NeU4YUyTX2fN9XTTRDpqddL94AvvWrcvVf4FGKaXBsd'
const feeVaultAddress = 'CGfUqdJoGKSEQMjdiRebxTxqB2PtfsJcphorC5Nnpxgs'
const lossVaultAddress = 'J5TUHd2nzueopWNatEMW514uAYwyyLxioYsPQA6UuGt2'
const clockSysvarAddress = 'SysvarC1ock11111111111111111111111111111111'
const tokenProgramAddress = TOKEN_PROGRAM_ID.toBase58()
const minRate = '950000000000000000'
const maxRate = '1050000000000000000'

const accountingDiscriminator = Buffer.from([9, 238, 56, 53, 228, 92, 217, 40])
const controllerDiscriminator = Buffer.from([184, 79, 171, 0, 183, 43, 113, 110])
const strategyDiscriminator = Buffer.from([174, 110, 39, 119, 82, 106, 169, 102])

const seniorShares = 200_000_000n
const juniorShares = 450_000_000n
const totalAssets = 650_000_001n
const seniorAssets = 200_000_000n
const mintDecimals = 6
const expectedSeniorRate = '1000000000000000000'
const expectedJuniorRate = '1000000002222222222'
const expectedHalfVestedSeniorRate = '1020000000000000000'
const expectedHalfVestedJuniorRate = '1013333333333333333'

const writeU128LE = (buffer: Buffer, value: bigint, offset: number) => {
  buffer.writeBigUInt64LE(value & ((1n << 64n) - 1n), offset)
  buffer.writeBigUInt64LE(value >> 64n, offset + 8)
}

const writeU64LE = (buffer: Buffer, value: bigint, offset: number) => {
  buffer.writeBigUInt64LE(value, offset)
}

const writePublicKey = (buffer: Buffer, address: string, offset: number) => {
  new PublicKey(address).toBuffer().copy(buffer, offset)
}

const writeName = (buffer: Buffer, value: string, offset: number) => {
  Buffer.from(value).copy(buffer, offset)
}

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

const encodeClock = (unixTimestamp: bigint) => {
  const buffer = Buffer.alloc(40)
  buffer.writeBigUInt64LE(0n, 0)
  buffer.writeBigInt64LE(0n, 8)
  buffer.writeBigUInt64LE(0n, 16)
  buffer.writeBigUInt64LE(0n, 24)
  buffer.writeBigInt64LE(unixTimestamp, 32)
  return buffer.toString('base64')
}

const encodeController = (overrideAssetMintAddress = assetMintAddress) => {
  const buffer = Buffer.alloc(106)
  controllerDiscriminator.copy(buffer, 0)
  writePublicKey(buffer, overrideAssetMintAddress, 73)
  buffer[105] = 0
  return buffer.toString('base64')
}

const encodeStrategy = (overrideName = strategyName) => {
  const buffer = Buffer.alloc(337)
  strategyDiscriminator.copy(buffer, 0)
  writeName(buffer, overrideName, 8)
  buffer[40] = 255
  buffer[41] = 254
  buffer[42] = 253
  buffer[43] = 252
  buffer[44] = 251
  buffer[45] = 250
  buffer[46] = 249
  writePublicKey(buffer, juniorMintAddress, 47)
  writePublicKey(buffer, seniorMintAddress, 79)
  writePublicKey(buffer, assetVaultAddress, 111)
  writePublicKey(buffer, vestingVaultAddress, 143)
  writePublicKey(buffer, feeVaultAddress, 175)
  writePublicKey(buffer, lossVaultAddress, 207)
  buffer[239] = 0
  buffer[240] = 0
  writeU128LE(buffer, 1_000_000_000_000_000n, 305)
  writeU128LE(buffer, 1_000_000_000_000_000n, 321)
  return buffer.toString('base64')
}

const encodeAccounting = ({
  name = strategyName,
  seniorSharesValue = seniorShares,
  juniorSharesValue = juniorShares,
  totalAssetsValue = totalAssets,
  seniorAssetsValue = seniorAssets,
  totalVestingAssetsValue = 0n,
  seniorVestingAssetsValue = 0n,
  vestingStartTimeValue = 0n,
  vestingEndTimeValue = 0n,
} = {}) => {
  const buffer = Buffer.alloc(185)
  accountingDiscriminator.copy(buffer, 0)
  writeName(buffer, name, 8)
  buffer[40] = 255
  writeU128LE(buffer, seniorSharesValue, 41)
  writeU128LE(buffer, juniorSharesValue, 57)
  writeU128LE(buffer, totalAssetsValue, 73)
  writeU128LE(buffer, seniorAssetsValue, 89)
  writeU64LE(buffer, totalVestingAssetsValue, 105)
  writeU64LE(buffer, seniorVestingAssetsValue, 113)
  writeU64LE(buffer, vestingStartTimeValue, 121)
  writeU64LE(buffer, vestingEndTimeValue, 129)
  return buffer.toString('base64')
}

const makeAccountInfoResponse = (data: string, owner = tokenProgramAddress) => ({
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

describe('StrcusxExchangeRateTransport', () => {
  const transportName = 'default_single_transport'
  const endpointName = 'strcusx-exchange-rate'
  const RPC_URL = 'https://solana.rpc.url'
  const BACKGROUND_EXECUTE_MS = 1500

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

  const juniorParam = makeStub('juniorParam', {
    endpoint: 'strcusx-exchange-rate',
    programAddress,
    strategyName,
    tranche: 'junior',
    minRate,
    maxRate,
  })

  const seniorParam = makeStub('seniorParam', {
    ...juniorParam,
    tranche: 'senior',
  })

  let transport: StrcusxExchangeRateTransport

  const mockValidAccountData = (accountingData = encodeAccounting(), unixTimestamp = 0n) => {
    const accountsByAddress: Record<string, ReturnType<typeof makeAccountInfoResponse>> = {
      [controllerAddress]: makeAccountInfoResponse(encodeController(), programAddress),
      [strategyAddress]: makeAccountInfoResponse(encodeStrategy(), programAddress),
      [accountingAddress]: makeAccountInfoResponse(accountingData, programAddress),
      [assetMintAddress]: makeAccountInfoResponse(
        encodeMint(1_000_000_000_000_000_000n, mintDecimals),
      ),
      [juniorMintAddress]: makeAccountInfoResponse(encodeMint(juniorShares, mintDecimals)),
      [seniorMintAddress]: makeAccountInfoResponse(encodeMint(seniorShares, mintDecimals)),
      [clockSysvarAddress]: makeAccountInfoResponse(encodeClock(unixTimestamp)),
    }

    getMultipleAccountsSendMock.mockImplementation((addresses: string[]) => ({
      value: addresses.map((address) => accountsByAddress[address] ?? null),
    }))
  }

  beforeEach(async () => {
    restoreEnv()
    jest.resetAllMocks()
    mockRpcRequests()
    jest.useFakeTimers()

    transport = new StrcusxExchangeRateTransport()

    await transport.initialize(dependencies, adapterSettings, endpointName, transportName)
  })

  afterEach(() => {
    expect(log).not.toBeCalled()
  })

  describe('PDA derivation', () => {
    it('should derive expected devnet addresses', () => {
      expect(deriveControllerAddress(programAddress)).toBe(controllerAddress)
      expect(deriveStrategyAddress(programAddress, strategyName)).toBe(strategyAddress)
      expect(deriveAccountingAddress(programAddress, strategyName)).toBe(accountingAddress)
      expect(deriveJuniorMintAddress(programAddress, strategyName)).toBe(juniorMintAddress)
      expect(deriveSeniorMintAddress(programAddress, strategyName)).toBe(seniorMintAddress)
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

      await transport.handleRequest(juniorParam)

      expect(responseCache.write).toBeCalledWith(transportName, [
        {
          params: juniorParam,
          response: expect.objectContaining({
            statusCode: 200,
            result: expectedJuniorRate,
            data: expect.objectContaining({
              result: expectedJuniorRate,
              computedResult: expectedJuniorRate,
              tranche: 'junior',
            }),
          }),
        },
      ])
      expect(responseCache.write).toBeCalledTimes(1)
    })
  })

  describe('_handleRequest', () => {
    it('should return the junior tranche exchange rate', async () => {
      mockValidAccountData()

      const response = await transport._handleRequest(juniorParam)

      expect(response).toEqual({
        statusCode: 200,
        result: expectedJuniorRate,
        data: {
          result: expectedJuniorRate,
          computedResult: expectedJuniorRate,
          tranche: 'junior',
          decimals: 18,
          minRate,
          maxRate,
          boundsApplied: false,
        },
        timestamps: {
          providerDataRequestedUnixMs: Date.now(),
          providerDataReceivedUnixMs: Date.now(),
          providerIndicatedTimeUnixMs: undefined,
        },
      })
      expect(getMultipleAccountsRequestMock).toBeCalledWith(
        [
          controllerAddress,
          strategyAddress,
          accountingAddress,
          juniorMintAddress,
          seniorMintAddress,
          clockSysvarAddress,
        ],
        { encoding: 'base64' },
      )
      expect(getMultipleAccountsRequestMock).toBeCalledWith([assetMintAddress], {
        encoding: 'base64',
      })
    })

    it('should return the senior tranche exchange rate', async () => {
      mockValidAccountData()

      const response = await transport._handleRequest(seniorParam)

      expect(response.result).toBe(expectedSeniorRate)
      expect(response.data?.result).toBe(expectedSeniorRate)
      expect(response.data?.computedResult).toBe(expectedSeniorRate)
      expect(response.data?.tranche).toBe('senior')
    })

    it('should exclude unvested total and senior yield from exchange rates', async () => {
      mockValidAccountData(
        encodeAccounting({
          totalAssetsValue: 670_000_000n,
          seniorAssetsValue: 208_000_000n,
          totalVestingAssetsValue: 20_000_000n,
          seniorVestingAssetsValue: 8_000_000n,
          vestingStartTimeValue: 1_000n,
          vestingEndTimeValue: 3_000n,
        }),
        2_000n,
      )

      const juniorResponse = await transport._handleRequest(juniorParam)
      const seniorResponse = await transport._handleRequest(seniorParam)

      expect(juniorResponse.result).toBe(expectedHalfVestedJuniorRate)
      expect(juniorResponse.data?.computedResult).toBe(expectedHalfVestedJuniorRate)
      expect(seniorResponse.result).toBe(expectedHalfVestedSeniorRate)
      expect(seniorResponse.data?.computedResult).toBe(expectedHalfVestedSeniorRate)
      expect(getMultipleAccountsRequestMock).toBeCalledWith(
        expect.arrayContaining([clockSysvarAddress, juniorMintAddress, seniorMintAddress]),
        { encoding: 'base64' },
      )
    })

    it('should treat non-active vesting schedules as fully vested', async () => {
      mockValidAccountData(
        encodeAccounting({
          totalVestingAssetsValue: 20_000_000n,
          seniorVestingAssetsValue: 8_000_000n,
          vestingStartTimeValue: 3_000n,
          vestingEndTimeValue: 1_000n,
        }),
        2_000n,
      )

      const juniorResponse = await transport._handleRequest(juniorParam)
      const seniorResponse = await transport._handleRequest(seniorParam)

      expect(juniorResponse.result).toBe(expectedJuniorRate)
      expect(seniorResponse.result).toBe(expectedSeniorRate)
    })

    it('should clamp the exchange rate to minRate', async () => {
      mockValidAccountData()
      const minClampedRate = (BigInt(expectedJuniorRate) + 1n).toString()

      const response = await transport._handleRequest({
        ...juniorParam,
        minRate: minClampedRate,
      })

      expect(response.result).toBe(minClampedRate)
      expect(response.data?.result).toBe(minClampedRate)
      expect(response.data?.computedResult).toBe(expectedJuniorRate)
      expect(response.data?.boundsApplied).toBe(true)
    })

    it('should clamp the exchange rate to maxRate', async () => {
      mockValidAccountData()
      const maxClampedRate = (BigInt(expectedJuniorRate) - 1n).toString()

      const response = await transport._handleRequest({
        ...juniorParam,
        maxRate: maxClampedRate,
      })

      expect(response.result).toBe(maxClampedRate)
      expect(response.data?.result).toBe(maxClampedRate)
      expect(response.data?.computedResult).toBe(expectedJuniorRate)
      expect(response.data?.boundsApplied).toBe(true)
    })

    it('should error when request inputs are invalid', async () => {
      await expect(
        transport._handleRequest({
          ...juniorParam,
          tranche: 'mezzanine',
        }),
      ).rejects.toThrow("tranche must be either 'junior' or 'senior'")

      await expect(
        transport._handleRequest({
          ...juniorParam,
          minRate: maxRate,
          maxRate: minRate,
        }),
      ).rejects.toThrow('minRate must be less than or equal to maxRate')

      await expect(
        transport._handleRequest({
          ...juniorParam,
          minRate: '0',
        }),
      ).rejects.toThrow('minRate must be a positive base-10 integer string')
    })

    it('should error when account state is inconsistent', async () => {
      const accountsByAddress: Record<string, ReturnType<typeof makeAccountInfoResponse>> = {
        [controllerAddress]: makeAccountInfoResponse(encodeController(), programAddress),
        [strategyAddress]: makeAccountInfoResponse(encodeStrategy(), programAddress),
        [accountingAddress]: makeAccountInfoResponse(
          encodeAccounting({ totalAssetsValue: seniorAssets - 1n }),
          programAddress,
        ),
      }
      getMultipleAccountsSendMock.mockImplementation((addresses: string[]) => ({
        value: addresses.map((address) => accountsByAddress[address] ?? null),
      }))

      await expect(transport._handleRequest(juniorParam)).rejects.toThrow(
        'totalAssets must be greater than or equal to seniorAssets',
      )
    })

    it('should error when selected tranche shares are zero', async () => {
      const accountsByAddress: Record<string, ReturnType<typeof makeAccountInfoResponse>> = {
        [controllerAddress]: makeAccountInfoResponse(encodeController(), programAddress),
        [strategyAddress]: makeAccountInfoResponse(encodeStrategy(), programAddress),
        [accountingAddress]: makeAccountInfoResponse(
          encodeAccounting({ juniorSharesValue: 0n }),
          programAddress,
        ),
        [assetMintAddress]: makeAccountInfoResponse(
          encodeMint(1_000_000_000_000_000_000n, mintDecimals),
        ),
        [juniorMintAddress]: makeAccountInfoResponse(encodeMint(0n, mintDecimals)),
        [seniorMintAddress]: makeAccountInfoResponse(encodeMint(seniorShares, mintDecimals)),
        [clockSysvarAddress]: makeAccountInfoResponse(encodeClock(0n)),
      }
      getMultipleAccountsSendMock.mockImplementation((addresses: string[]) => ({
        value: addresses.map((address) => accountsByAddress[address] ?? null),
      }))

      await expect(transport._handleRequest(juniorParam)).rejects.toThrow(
        'junior tranche shares are zero',
      )
    })

    it('should error when mint supply does not match accounting shares', async () => {
      mockValidAccountData()
      getMultipleAccountsSendMock.mockImplementation((addresses: string[]) => ({
        value: addresses.map((address) => {
          if (address === juniorMintAddress) {
            return makeAccountInfoResponse(encodeMint(juniorShares + 1n, mintDecimals))
          }
          const accountsByAddress: Record<string, ReturnType<typeof makeAccountInfoResponse>> = {
            [controllerAddress]: makeAccountInfoResponse(encodeController(), programAddress),
            [strategyAddress]: makeAccountInfoResponse(encodeStrategy(), programAddress),
            [accountingAddress]: makeAccountInfoResponse(encodeAccounting(), programAddress),
            [assetMintAddress]: makeAccountInfoResponse(
              encodeMint(1_000_000_000_000_000_000n, mintDecimals),
            ),
            [seniorMintAddress]: makeAccountInfoResponse(encodeMint(seniorShares, mintDecimals)),
          }
          return accountsByAddress[address] ?? null
        }),
      }))

      await expect(transport._handleRequest(juniorParam)).rejects.toThrow(
        'Expected junior mint supply to equal accounting juniorShares',
      )
    })

    it('should error when strategy/accounting names do not match the request', async () => {
      const accountsByAddress: Record<string, ReturnType<typeof makeAccountInfoResponse>> = {
        [controllerAddress]: makeAccountInfoResponse(encodeController(), programAddress),
        [strategyAddress]: makeAccountInfoResponse(encodeStrategy('OTHER'), programAddress),
        [accountingAddress]: makeAccountInfoResponse(encodeAccounting(), programAddress),
      }
      getMultipleAccountsSendMock.mockImplementation((addresses: string[]) => ({
        value: addresses.map((address) => accountsByAddress[address] ?? null),
      }))

      await expect(transport._handleRequest(juniorParam)).rejects.toThrow(
        "Expected Strategy name to be 'STRC-USX-1', found 'OTHER'",
      )
    })
  })
})
