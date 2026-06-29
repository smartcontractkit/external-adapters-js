import { TransportDependencies } from '@chainlink/external-adapter-framework/transports'
import { LoggerFactoryProvider } from '@chainlink/external-adapter-framework/util'
import { makeStub } from '@chainlink/external-adapter-framework/util/testing-utils'
import { MintLayout, TOKEN_2022_PROGRAM_ID, TOKEN_PROGRAM_ID } from '@solana/spl-token'
import { PublicKey } from '@solana/web3.js'
import { BaseEndpointTypes } from '../../src/endpoint/strcusx-exchange-rate'
import { deriveAccountAddress, PDA_SEEDS } from '../../src/transport/strcusx-accounts'
import { StrcusxExchangeRateTransport } from '../../src/transport/strcusx-exchange-rate'
import strcusxAccountFixture from '../fixtures/strcusx-account-data-2026-06-25.json'

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
const token2022ProgramAddress = TOKEN_2022_PROGRAM_ID.toBase58()
const minRate = '950000000000000000'
const maxRate = '1050000000000000000'
const clockUnixTimestamp = 1_781_704_234n
const providerIndicatedTimeUnixMs = Number(clockUnixTimestamp * 1000n)

const accountingDiscriminator = Buffer.from([9, 238, 56, 53, 228, 92, 217, 40])
const controllerDiscriminator = Buffer.from([184, 79, 171, 0, 183, 43, 113, 110])
const strategyDiscriminator = Buffer.from([174, 110, 39, 119, 82, 106, 169, 102])
const controllerAccountLength = 362
const strategyAccountLength = 617
const accountingAccountLength = 441

const seniorShares = 200_000_000n
const juniorShares = 450_000_000n
const totalAssets = 650_000_001n
const seniorAssets = 200_000_000n
const juniorAssets = totalAssets - seniorAssets
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

const encodeMintWithExtensions = (supply: bigint, decimals: number) =>
  Buffer.concat([
    Buffer.from(encodeMint(supply, decimals), 'base64'),
    Buffer.alloc(64, 1),
  ]).toString('base64')

const encodeClock = (unixTimestamp: bigint) => {
  const buffer = Buffer.alloc(40)
  buffer.writeBigUInt64LE(0n, 0)
  buffer.writeBigInt64LE(0n, 8)
  buffer.writeBigUInt64LE(0n, 16)
  buffer.writeBigUInt64LE(0n, 24)
  buffer.writeBigInt64LE(unixTimestamp, 32)
  return buffer.toString('base64')
}

const encodeController = () => {
  const buffer = Buffer.alloc(controllerAccountLength)
  controllerDiscriminator.copy(buffer, 0)
  writePublicKey(buffer, assetMintAddress, 73)
  buffer[105] = 0
  return buffer.toString('base64')
}

const encodeStrategy = () => {
  const buffer = Buffer.alloc(strategyAccountLength)
  strategyDiscriminator.copy(buffer, 0)
  writeName(buffer, strategyName, 8)
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
  const buffer = Buffer.alloc(accountingAccountLength)
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

  const juniorParam = makeStub('juniorParam', {
    endpoint: 'strcusx-exchange-rate',
    programAddress,
    strategyName,
    tranche: 'junior' as const,
    minRate,
    maxRate,
  } as const)

  const seniorParam = makeStub('seniorParam', {
    ...juniorParam,
    tranche: 'senior' as const,
  })

  let transport: StrcusxExchangeRateTransport

  type AccountInfo = ReturnType<typeof makeAccountInfoResponse> | null

  const getFixtureAccountInfo = (index: number): Exclude<AccountInfo, null> => {
    const account = strcusxAccountFixture.result.value[index]
    if (!account) {
      throw new Error(`Missing strcUSX fixture account at index ${index}`)
    }

    return {
      data: account.data as [string, string],
      owner: account.owner,
    }
  }

  const mockAccountData = ({
    accountingData = encodeAccounting(),
    unixTimestamp = clockUnixTimestamp,
    overrides = {},
  }: {
    accountingData?: string
    unixTimestamp?: bigint
    overrides?: Record<string, AccountInfo>
  } = {}) => {
    const accountsByAddress: Record<string, AccountInfo> = {
      [controllerAddress]: makeAccountInfoResponse(encodeController(), programAddress),
      [strategyAddress]: makeAccountInfoResponse(encodeStrategy(), programAddress),
      [accountingAddress]: makeAccountInfoResponse(accountingData, programAddress),
      [assetMintAddress]: makeAccountInfoResponse(
        encodeMint(1_000_000_000_000_000_000n, mintDecimals),
      ),
      [juniorMintAddress]: makeAccountInfoResponse(encodeMint(juniorShares, mintDecimals)),
      [seniorMintAddress]: makeAccountInfoResponse(encodeMint(seniorShares, mintDecimals)),
      [clockSysvarAddress]: makeAccountInfoResponse(encodeClock(unixTimestamp)),
      ...overrides,
    }

    getMultipleAccountsSendMock.mockImplementation((addresses: string[]) => ({
      value: addresses.map((address) => accountsByAddress[address] ?? null),
    }))
  }

  beforeEach(async () => {
    jest.resetAllMocks()
    mockRpcRequests()

    transport = new StrcusxExchangeRateTransport()

    await transport.initialize(dependencies, adapterSettings, endpointName, transportName)
  })

  describe('PDA derivation', () => {
    it('should derive expected devnet addresses', async () => {
      expect(await deriveAccountAddress(programAddress, [PDA_SEEDS.CONTROLLER])).toBe(
        controllerAddress,
      )
      expect(await deriveAccountAddress(programAddress, [PDA_SEEDS.STRATEGY, strategyName])).toBe(
        strategyAddress,
      )
      expect(await deriveAccountAddress(programAddress, [PDA_SEEDS.ACCOUNTING, strategyName])).toBe(
        accountingAddress,
      )
    })
  })

  describe('handleRequest', () => {
    it('should cache a 502 response when Solana account fetch rejects', async () => {
      getMultipleAccountsSendMock.mockRejectedValueOnce(new Error('RPC unavailable'))

      await transport.handleRequest(juniorParam)

      expect(dependencies.responseCache.write).toBeCalledWith(transportName, [
        {
          params: juniorParam,
          response: {
            statusCode: 502,
            errorMessage: 'RPC unavailable',
            timestamps: {
              providerDataRequestedUnixMs: 0,
              providerDataReceivedUnixMs: 0,
              providerIndicatedTimeUnixMs: undefined,
            },
          },
        },
      ])
      expect(dependencies.responseCache.write).toBeCalledTimes(1)
    })
  })

  describe('_handleRequest', () => {
    it('should decode recorded real strcUSX account fixtures', async () => {
      expect(strcusxAccountFixture.result.value.map((account) => account.space)).toEqual([
        controllerAccountLength,
        strategyAccountLength,
        accountingAccountLength,
      ])
      expect(
        strcusxAccountFixture.result.value.map(
          (account) => Buffer.from(account.data[0]!, 'base64').length,
        ),
      ).toEqual([controllerAccountLength, strategyAccountLength, accountingAccountLength])

      mockAccountData({
        unixTimestamp: 1n,
        overrides: {
          [controllerAddress]: getFixtureAccountInfo(0),
          [strategyAddress]: getFixtureAccountInfo(1),
          [accountingAddress]: getFixtureAccountInfo(2),
        },
      })

      const response = await transport._handleRequest(juniorParam)

      expect(response.data).toMatchObject({
        result: '1000000000000000000',
        computedResult: '1000000000000000000',
        trancheAssets: '450000000',
        trancheShares: juniorShares.toString(),
      })
    })

    it('should return the junior tranche exchange rate', async () => {
      mockAccountData()

      const response = await transport._handleRequest(juniorParam)

      expect(response).toEqual({
        statusCode: 200,
        result: expectedJuniorRate,
        data: {
          result: expectedJuniorRate,
          computedResult: expectedJuniorRate,
          tranche: 'junior',
          decimals: 18,
          boundsApplied: false,
          trancheAssets: juniorAssets.toString(),
          trancheShares: juniorShares.toString(),
        },
        timestamps: {
          providerDataRequestedUnixMs: expect.any(Number),
          providerDataReceivedUnixMs: expect.any(Number),
          providerIndicatedTimeUnixMs,
        },
      })
      expect(getMultipleAccountsRequestMock).toBeCalledWith(
        [controllerAddress, strategyAddress, accountingAddress, clockSysvarAddress],
        { encoding: 'base64' },
      )
      expect(getMultipleAccountsRequestMock).toBeCalledWith([assetMintAddress, juniorMintAddress], {
        encoding: 'base64',
      })
    })

    it('should return the senior tranche exchange rate', async () => {
      mockAccountData()

      const response = await transport._handleRequest(seniorParam)

      expect(response.result).toBe(expectedSeniorRate)
      expect(response.data?.result).toBe(expectedSeniorRate)
      expect(response.data?.computedResult).toBe(expectedSeniorRate)
      expect(response.data?.tranche).toBe('senior')
      expect(response.data?.trancheAssets).toBe(seniorAssets.toString())
      expect(response.data?.trancheShares).toBe(seniorShares.toString())
      expect(getMultipleAccountsRequestMock).toBeCalledWith([assetMintAddress, seniorMintAddress], {
        encoding: 'base64',
      })
    })

    it('should decode Token-2022 mint accounts with extension bytes', async () => {
      mockAccountData({
        overrides: {
          [assetMintAddress]: makeAccountInfoResponse(
            encodeMintWithExtensions(1_000_000_000_000_000_000n, mintDecimals),
            token2022ProgramAddress,
          ),
          [juniorMintAddress]: makeAccountInfoResponse(
            encodeMintWithExtensions(juniorShares, mintDecimals),
            token2022ProgramAddress,
          ),
        },
      })

      const response = await transport._handleRequest(juniorParam)

      expect(response.result).toBe(expectedJuniorRate)
      expect(response.data?.trancheAssets).toBe(juniorAssets.toString())
      expect(response.data?.trancheShares).toBe(juniorShares.toString())
    })

    it('should exclude unvested total and senior yield from exchange rates', async () => {
      mockAccountData({
        accountingData: encodeAccounting({
          totalAssetsValue: 670_000_000n,
          seniorAssetsValue: 208_000_000n,
          totalVestingAssetsValue: 20_000_000n,
          seniorVestingAssetsValue: 8_000_000n,
          vestingStartTimeValue: 1_000n,
          vestingEndTimeValue: 3_000n,
        }),
        unixTimestamp: 2_000n,
      })

      const juniorResponse = await transport._handleRequest(juniorParam)
      const seniorResponse = await transport._handleRequest(seniorParam)

      expect(juniorResponse.result).toBe(expectedHalfVestedJuniorRate)
      expect(juniorResponse.data?.computedResult).toBe(expectedHalfVestedJuniorRate)
      expect(seniorResponse.result).toBe(expectedHalfVestedSeniorRate)
      expect(seniorResponse.data?.computedResult).toBe(expectedHalfVestedSeniorRate)
      expect(juniorResponse.data?.trancheAssets).toBe('456000000')
      expect(juniorResponse.data?.trancheShares).toBe(juniorShares.toString())
      expect(seniorResponse.data?.trancheAssets).toBe('204000000')
      expect(seniorResponse.data?.trancheShares).toBe(seniorShares.toString())
      expect(getMultipleAccountsRequestMock).toBeCalledWith(
        expect.arrayContaining([clockSysvarAddress]),
        { encoding: 'base64' },
      )
    })

    it('should floor the direct unvested asset calculation during active vesting', async () => {
      mockAccountData({
        accountingData: encodeAccounting({
          totalVestingAssetsValue: 10n,
          seniorVestingAssetsValue: 4n,
          vestingStartTimeValue: 0n,
          vestingEndTimeValue: 3n,
        }),
        unixTimestamp: 1n,
      })

      const response = await transport._handleRequest(seniorParam)

      expect(response.result).toBe('999999990000000000')
      expect(response.data?.computedResult).toBe('999999990000000000')
      expect(response.data?.trancheAssets).toBe('199999998')
      expect(response.data?.trancheShares).toBe(seniorShares.toString())
    })

    it('should treat non-active vesting schedules as fully vested', async () => {
      mockAccountData({
        accountingData: encodeAccounting({
          totalVestingAssetsValue: 20_000_000n,
          seniorVestingAssetsValue: 8_000_000n,
          vestingStartTimeValue: 3_000n,
          vestingEndTimeValue: 1_000n,
        }),
        unixTimestamp: 2_000n,
      })

      const juniorResponse = await transport._handleRequest(juniorParam)
      const seniorResponse = await transport._handleRequest(seniorParam)

      expect(juniorResponse.result).toBe(expectedJuniorRate)
      expect(seniorResponse.result).toBe(expectedSeniorRate)
    })

    it('should clamp the exchange rate to minRate', async () => {
      mockAccountData()
      const minClampedRate = (BigInt(expectedJuniorRate) + 1n).toString()

      const response = await transport._handleRequest({
        ...juniorParam,
        minRate: minClampedRate,
      })

      expect(response.result).toBe(minClampedRate)
      expect(response.data?.result).toBe(minClampedRate)
      expect(response.data?.computedResult).toBe(expectedJuniorRate)
      expect(response.data?.boundsApplied).toBe(true)
      expect(log).toHaveBeenCalledWith(
        {
          tranche: 'junior',
          computedResult: expectedJuniorRate,
          result: minClampedRate,
          minRate: minClampedRate,
          maxRate,
        },
        'strcUSX exchange rate bounds applied',
      )
    })

    it('should clamp the exchange rate to maxRate', async () => {
      mockAccountData()
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
      mockAccountData({
        overrides: {
          [accountingAddress]: makeAccountInfoResponse(
            encodeAccounting({ totalAssetsValue: seniorAssets - 1n }),
            programAddress,
          ),
        },
      })

      await expect(transport._handleRequest(juniorParam)).rejects.toThrow(
        'vested totalAssets must be greater than or equal to vested seniorAssets',
      )
    })

    it('should error when selected tranche shares are zero', async () => {
      mockAccountData({
        overrides: {
          [accountingAddress]: makeAccountInfoResponse(
            encodeAccounting({ juniorSharesValue: 0n }),
            programAddress,
          ),
        },
      })

      await expect(transport._handleRequest(juniorParam)).rejects.toThrow(
        'junior tranche shares are zero',
      )
    })
  })
})
