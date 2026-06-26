import {
  TestAdapter,
  makeStub,
  setEnvVariables,
} from '@chainlink/external-adapter-framework/util/testing-utils'
import { MintLayout, TOKEN_PROGRAM_ID } from '@solana/spl-token'
import { PublicKey } from '@solana/web3.js'

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
const clockUnixTimestamp = 1_781_704_234n

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
const mintDecimals = 6
const expectedJuniorRate = '1000000002222222222'
const expectedSeniorRate = '1000000000000000000'
const providerDataTimestampUnixMs = 1_781_704_234_111
const providerIndicatedTimeUnixMs = Number(clockUnixTimestamp * 1000n)

const writeU128LE = (buffer: Buffer, value: bigint, offset: number) => {
  buffer.writeBigUInt64LE(value & ((1n << 64n) - 1n), offset)
  buffer.writeBigUInt64LE(value >> 64n, offset + 8)
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
  writePublicKey(buffer, juniorMintAddress, 47)
  writePublicKey(buffer, seniorMintAddress, 79)
  writePublicKey(buffer, assetVaultAddress, 111)
  writePublicKey(buffer, vestingVaultAddress, 143)
  writePublicKey(buffer, feeVaultAddress, 175)
  writePublicKey(buffer, lossVaultAddress, 207)
  writeU128LE(buffer, 1_000_000_000_000_000n, 305)
  writeU128LE(buffer, 1_000_000_000_000_000n, 321)
  return buffer.toString('base64')
}

const encodeAccounting = () => {
  const buffer = Buffer.alloc(accountingAccountLength)
  accountingDiscriminator.copy(buffer, 0)
  writeName(buffer, strategyName, 8)
  writeU128LE(buffer, seniorShares, 41)
  writeU128LE(buffer, juniorShares, 57)
  writeU128LE(buffer, totalAssets, 73)
  writeU128LE(buffer, seniorAssets, 89)
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
        [controllerAddress]: makeAccountInfoResponse(encodeController(), programAddress),
        [strategyAddress]: makeAccountInfoResponse(encodeStrategy(), programAddress),
        [accountingAddress]: makeAccountInfoResponse(encodeAccounting(), programAddress),
        [assetMintAddress]: makeAccountInfoResponse(
          encodeMint(1_000_000_000_000_000_000n, mintDecimals),
        ),
        [juniorMintAddress]: makeAccountInfoResponse(encodeMint(juniorShares, mintDecimals)),
        [seniorMintAddress]: makeAccountInfoResponse(encodeMint(seniorShares, mintDecimals)),
        [clockSysvarAddress]: makeAccountInfoResponse(encodeClock(clockUnixTimestamp)),
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
    const mockDate = new Date('2026-06-17T13:50:34.111Z')
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

  describe('strcusx-exchange-rate', () => {
    it('should return junior success', async () => {
      const response = await testAdapter.request({
        endpoint: 'strcusx-exchange-rate',
        programAddress,
        strategyName,
        tranche: 'junior',
        minRate,
        maxRate,
      })
      expect(response.statusCode).toBe(200)
      expect(response.json()).toEqual({
        data: {
          boundsApplied: false,
          computedResult: expectedJuniorRate,
          decimals: 18,
          result: expectedJuniorRate,
          trancheAssets: (totalAssets - seniorAssets).toString(),
          trancheShares: juniorShares.toString(),
          tranche: 'junior',
        },
        result: expectedJuniorRate,
        statusCode: 200,
        timestamps: {
          providerDataReceivedUnixMs: providerDataTimestampUnixMs,
          providerDataRequestedUnixMs: providerDataTimestampUnixMs,
          providerIndicatedTimeUnixMs,
        },
      })
    })

    it('should return senior success', async () => {
      const response = await testAdapter.request({
        endpoint: 'strcusx-exchange-rate',
        programAddress,
        strategyName,
        tranche: 'senior',
        minRate,
        maxRate,
      })
      expect(response.statusCode).toBe(200)
      expect(response.json()).toEqual({
        data: {
          boundsApplied: false,
          computedResult: expectedSeniorRate,
          decimals: 18,
          result: expectedSeniorRate,
          trancheAssets: seniorAssets.toString(),
          trancheShares: seniorShares.toString(),
          tranche: 'senior',
        },
        result: expectedSeniorRate,
        statusCode: 200,
        timestamps: {
          providerDataReceivedUnixMs: providerDataTimestampUnixMs,
          providerDataRequestedUnixMs: providerDataTimestampUnixMs,
          providerIndicatedTimeUnixMs,
        },
      })
    })

    it('should return success when bounds are omitted', async () => {
      const response = await testAdapter.request({
        endpoint: 'strcusx-exchange-rate',
        programAddress,
        strategyName,
        tranche: 'junior',
      })

      expect(response.statusCode).toBe(200)
      expect(response.json().data.boundsApplied).toBe(false)
      expect(response.json().result).toBe(expectedJuniorRate)
    })

    it('should reject inverted bounds', async () => {
      const response = await testAdapter.request({
        endpoint: 'strcusx-exchange-rate',
        programAddress,
        strategyName,
        tranche: 'junior',
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
