import { TransportDependencies } from '@chainlink/external-adapter-framework/transports'
import { LoggerFactoryProvider } from '@chainlink/external-adapter-framework/util'
import { makeStub } from '@chainlink/external-adapter-framework/util/testing-utils'
import { ethers } from 'ethers'
import ERC20 from '../../src/config/ERC20.json'
import PositionManagerOwnable2StepWithShortcut from '../../src/config/PositionManagerOwnable2StepWithShortcut.json'
import { BaseEndpointTypes, inputParameters } from '../../src/endpoint/price'
import {
  CmethTransport,
  ContractBalanceMap,
  contractBalanceMapToString,
  createAddressMap,
  sumBigints,
} from '../../src/transport/price'

type RequestParams = typeof inputParameters.validated

const CMETH_ADDRESS = '0xE6829d9a7eE3040e1276Fa75293Bde931859e8fA'
const METH_ADDRESS = '0xd5F7838F5C461fefF7FE49ea5ebaF7728bB0ADfa'
const BORING_VAULT_ADDRESS = '0x33272D40b247c4cd9C646582C9bbAD44e85D4fE4'
const POSITION_MANAGER_ADDRESS = '0x52EA8E95378d01B0aaD3B034Ca0656b0F0cc21A2'
const POSITION_MANAGER_2_ADDRESS = '0x919531146f9a25dfc161d5ab23b117feae2c1d36'
const RESTAKING_POOL_ADDRESS = '0x475d3eb031d250070b63fa145f0fcfc5d97c304a'
const DELAYED_WITHDRAW_ADDRESS = '0x12Be34bE067Ebd201f6eAf78a861D90b2a66B113'

const RESULT_DECIMALS = 18

const BLOCK_HEIGHT = 12345678

const ethProvider = makeStub('ethProvider', {
  getBlockNumber: () => Promise.resolve(BLOCK_HEIGHT),
})

const createMockTokenContract = () => ({
  balanceOf: jest.fn(),
  totalSupply: jest.fn(),
})

const createMockPositionManagerContract = () => ({
  getTotalLPT: jest.fn(),
})

const cmethContract = createMockTokenContract()
const methContract = createMockTokenContract()
const restakingPoolContract = createMockTokenContract()
const positionManagerContract = createMockPositionManagerContract()
const positionManager2Contract = createMockPositionManagerContract()

const contracts = makeStub('contracts', {
  [CMETH_ADDRESS]: cmethContract,
  [METH_ADDRESS]: methContract,
  [RESTAKING_POOL_ADDRESS]: restakingPoolContract,
  [POSITION_MANAGER_ADDRESS]: positionManagerContract,
  [POSITION_MANAGER_2_ADDRESS]: positionManager2Contract,
} as unknown as Record<string, ethers.Contract>)

const makeEthers = () => {
  return {
    JsonRpcProvider: function () {
      return ethProvider
    },
    Contract: function (address: string) {
      if (!(address in contracts)) {
        throw new Error(`Contract not found: ${address}`)
      }
      return contracts[address]
    },
  }
}

jest.mock('ethers', () => ({
  ethers: makeEthers(),
}))

const log = jest.fn()
const logger = {
  fatal: log,
  error: log,
  warn: log,
  info: log,
  debug: log,
  trace: log,
}

const loggerFactory = { child: () => logger }

LoggerFactoryProvider.set(loggerFactory)

describe('CmethTransport', () => {
  const transportName = 'default_single_transport'
  const endpointName = 'price'
  const BACKGROUND_EXECUTE_MS = 1500

  const adapterSettings = makeStub('adapterSettings', {
    WARMUP_SUBSCRIPTION_TTL: 10_000,
    ETHEREUM_RPC_URL: 'https://eth.rpc.url',
    ETHEREUM_RPC_CHAIN_ID: 1,
    BACKGROUND_EXECUTE_MS,
  } as unknown as BaseEndpointTypes['Settings'])

  const responseCache = {
    write: jest.fn(),
  }

  let transport: CmethTransport

  beforeEach(() => {
    jest.clearAllMocks()
    jest.useFakeTimers()

    jest.spyOn(ethers, 'Contract')

    transport = new CmethTransport()

    const dependencies = makeStub('dependencies', {
      responseCache,
      subscriptionSetFactory: {
        buildSet: jest.fn(),
      },
    } as unknown as TransportDependencies<BaseEndpointTypes>)
    transport.initialize(dependencies, adapterSettings, endpointName, transportName)
  })

  afterEach(() => {
    expect(log).not.toBeCalled()
  })

  describe('handleRequest', () => {
    it('should cache cmeth response', async () => {
      const boringVaultBalance = 987000n
      const cmethTotalSupply = 1000000n

      methContract.balanceOf.mockResolvedValueOnce(boringVaultBalance)
      cmethContract.totalSupply.mockResolvedValueOnce(cmethTotalSupply)

      const param = makeStub('param', {
        addresses: [
          {
            name: 'cmETH',
            address: CMETH_ADDRESS,
          },
          {
            name: 'mETH',
            address: METH_ADDRESS,
          },
          {
            name: 'BoringVault',
            address: BORING_VAULT_ADDRESS,
          },
        ],
        balanceOf: [
          {
            tokenContract: 'mETH',
            account: 'BoringVault',
          },
        ],
        getTotalLPT: [],
      } as RequestParams)

      const now = Date.now()
      await transport.handleRequest(param)

      const result = '987000000000000000'

      expect(responseCache.write).toBeCalledWith(transportName, [
        {
          params: param,
          response: {
            data: {
              result,
              decimals: RESULT_DECIMALS,
              blockHeight: BLOCK_HEIGHT,
              balances: {
                mETH: {
                  BoringVault: String(boringVaultBalance),
                },
              },
              totalLpts: {},
              totalReserve: String(boringVaultBalance),
              totalSupply: String(cmethTotalSupply),
            },
            statusCode: 200,
            result,
            timestamps: {
              providerDataRequestedUnixMs: now,
              providerDataReceivedUnixMs: now,
            },
          },
        },
      ])
      expect(responseCache.write).toHaveBeenCalledTimes(1)
    })
  })

  describe('_handleRequest', () => {
    it('should return reserve-supply ratio', async () => {
      const boringVaultBalance = 987000n
      const cmethTotalSupply = 1000000n

      methContract.balanceOf.mockResolvedValueOnce(boringVaultBalance)
      cmethContract.totalSupply.mockResolvedValueOnce(cmethTotalSupply)

      const param = makeStub('param', {
        addresses: [
          {
            name: 'cmETH',
            address: CMETH_ADDRESS,
          },
          {
            name: 'mETH',
            address: METH_ADDRESS,
          },
          {
            name: 'BoringVault',
            address: BORING_VAULT_ADDRESS,
          },
        ],
        balanceOf: [
          {
            tokenContract: 'mETH',
            account: 'BoringVault',
          },
        ],
        getTotalLPT: [],
      } as RequestParams)

      const now = Date.now()
      const response = await transport._handleRequest(param)

      const result = '987000000000000000'

      expect(response).toEqual({
        data: {
          result,
          decimals: RESULT_DECIMALS,
          blockHeight: BLOCK_HEIGHT,
          balances: {
            mETH: {
              BoringVault: String(boringVaultBalance),
            },
          },
          totalLpts: {},
          totalReserve: String(boringVaultBalance),
          totalSupply: String(cmethTotalSupply),
        },
        statusCode: 200,
        result,
        timestamps: {
          providerDataRequestedUnixMs: now,
          providerDataReceivedUnixMs: now,
        },
      })

      expect(methContract.balanceOf).toHaveBeenCalledWith(BORING_VAULT_ADDRESS, {
        blockTag: BLOCK_HEIGHT,
      })
      expect(methContract.balanceOf).toHaveBeenCalledTimes(1)
      expect(cmethContract.totalSupply).toHaveBeenCalledTimes(1)
    })

    it('should return 1 if reserve > supply', async () => {
      const boringVaultBalance = 1234000n
      const cmethTotalSupply = 1000000n

      methContract.balanceOf.mockResolvedValueOnce(boringVaultBalance)
      cmethContract.totalSupply.mockResolvedValueOnce(cmethTotalSupply)

      const param = makeStub('param', {
        addresses: [
          {
            name: 'cmETH',
            address: CMETH_ADDRESS,
          },
          {
            name: 'mETH',
            address: METH_ADDRESS,
          },
          {
            name: 'BoringVault',
            address: BORING_VAULT_ADDRESS,
          },
        ],
        balanceOf: [
          {
            tokenContract: 'mETH',
            account: 'BoringVault',
          },
        ],
        getTotalLPT: [],
      } as RequestParams)

      const now = Date.now()
      const response = await transport._handleRequest(param)

      const result = '1000000000000000000'

      expect(response).toEqual({
        data: {
          result,
          decimals: RESULT_DECIMALS,
          blockHeight: BLOCK_HEIGHT,
          balances: {
            mETH: {
              BoringVault: String(boringVaultBalance),
            },
          },
          totalLpts: {},
          totalReserve: String(boringVaultBalance),
          totalSupply: String(cmethTotalSupply),
        },
        statusCode: 200,
        result,
        timestamps: {
          providerDataRequestedUnixMs: now,
          providerDataReceivedUnixMs: now,
        },
      })

      expect(methContract.balanceOf).toHaveBeenCalledWith(BORING_VAULT_ADDRESS, {
        blockTag: BLOCK_HEIGHT,
      })
      expect(methContract.balanceOf).toHaveBeenCalledTimes(1)
      expect(cmethContract.totalSupply).toHaveBeenCalledTimes(1)
    })

    it('should include getTotalLPT result in reserve', async () => {
      const boringVaultBalance = 400000n
      const positionManagerLpt = 500000n
      const cmethTotalSupply = 1000000n

      methContract.balanceOf.mockResolvedValueOnce(boringVaultBalance)
      positionManagerContract.getTotalLPT.mockResolvedValueOnce(positionManagerLpt)
      cmethContract.totalSupply.mockResolvedValueOnce(cmethTotalSupply)

      const param = makeStub('param', {
        addresses: [
          {
            name: 'cmETH',
            address: CMETH_ADDRESS,
          },
          {
            name: 'mETH',
            address: METH_ADDRESS,
          },
          {
            name: 'BoringVault',
            address: BORING_VAULT_ADDRESS,
          },
          {
            name: 'PositionManager',
            address: POSITION_MANAGER_ADDRESS,
          },
        ],
        balanceOf: [
          {
            tokenContract: 'mETH',
            account: 'BoringVault',
          },
        ],
        getTotalLPT: ['PositionManager'],
      } as RequestParams)

      const now = Date.now()
      const response = await transport._handleRequest(param)

      const result = '900000000000000000'

      expect(response).toEqual({
        data: {
          result,
          decimals: RESULT_DECIMALS,
          blockHeight: BLOCK_HEIGHT,
          balances: {
            mETH: {
              BoringVault: String(boringVaultBalance),
            },
          },
          totalLpts: {
            PositionManager: String(positionManagerLpt),
          },
          totalReserve: String(boringVaultBalance + positionManagerLpt),
          totalSupply: String(cmethTotalSupply),
        },
        statusCode: 200,
        result,
        timestamps: {
          providerDataRequestedUnixMs: now,
          providerDataReceivedUnixMs: now,
        },
      })

      expect(methContract.balanceOf).toHaveBeenCalledWith(BORING_VAULT_ADDRESS, {
        blockTag: BLOCK_HEIGHT,
      })
      expect(methContract.balanceOf).toHaveBeenCalledTimes(1)
      expect(positionManagerContract.getTotalLPT).toHaveBeenCalledTimes(1)
      expect(cmethContract.totalSupply).toHaveBeenCalledTimes(1)
    })

    it('should add up multiple balances and LPTs', async () => {
      const boringVaultBalance = 100001n
      const delayedWithdrawBalance = 100002n
      const restakingBalance = 100003n
      const positionManager1Lpt = 100004n
      const positionManager2Lpt = 100005n

      const cmethTotalSupply = 10000000n

      methContract.balanceOf.mockImplementation(async (address: string) => {
        switch (address) {
          case BORING_VAULT_ADDRESS:
            return boringVaultBalance
          case DELAYED_WITHDRAW_ADDRESS:
            return delayedWithdrawBalance
          default:
            throw new Error(`Unexpected address: ${address}`)
        }
      })
      restakingPoolContract.balanceOf.mockResolvedValueOnce(restakingBalance)
      positionManagerContract.getTotalLPT.mockResolvedValueOnce(positionManager1Lpt)
      positionManager2Contract.getTotalLPT.mockResolvedValueOnce(positionManager2Lpt)
      cmethContract.totalSupply.mockResolvedValueOnce(cmethTotalSupply)

      const param = makeStub('param', {
        addresses: [
          {
            name: 'cmETH',
            address: CMETH_ADDRESS,
          },
          {
            name: 'mETH',
            address: METH_ADDRESS,
          },
          {
            name: 'BoringVault',
            address: BORING_VAULT_ADDRESS,
          },
          {
            name: 'PositionManager1',
            address: POSITION_MANAGER_ADDRESS,
          },
          {
            name: 'PositionManager2',
            address: POSITION_MANAGER_2_ADDRESS,
          },
          {
            name: 'RestakingPool',
            address: RESTAKING_POOL_ADDRESS,
          },
          {
            name: 'DelayedWithdraw',
            address: DELAYED_WITHDRAW_ADDRESS,
          },
        ],
        balanceOf: [
          {
            tokenContract: 'mETH',
            account: 'BoringVault',
          },
          {
            tokenContract: 'mETH',
            account: 'DelayedWithdraw',
          },
          {
            tokenContract: 'RestakingPool',
            account: 'PositionManager1',
          },
        ],
        getTotalLPT: ['PositionManager1', 'PositionManager2'],
      } as RequestParams)

      const now = Date.now()
      const response = await transport._handleRequest(param)

      const result = '50001500000000000'

      expect(response).toEqual({
        data: {
          result,
          decimals: RESULT_DECIMALS,
          blockHeight: BLOCK_HEIGHT,
          balances: {
            mETH: {
              BoringVault: String(boringVaultBalance),
              DelayedWithdraw: String(delayedWithdrawBalance),
            },
            RestakingPool: {
              PositionManager1: String(restakingBalance),
            },
          },
          totalLpts: {
            PositionManager1: String(positionManager1Lpt),
            PositionManager2: String(positionManager2Lpt),
          },
          totalReserve: String(
            boringVaultBalance +
              delayedWithdrawBalance +
              restakingBalance +
              positionManager1Lpt +
              positionManager2Lpt,
          ),
          totalSupply: String(cmethTotalSupply),
        },
        statusCode: 200,
        result,
        timestamps: {
          providerDataRequestedUnixMs: now,
          providerDataReceivedUnixMs: now,
        },
      })

      expect(methContract.balanceOf).toHaveBeenCalledWith(BORING_VAULT_ADDRESS, {
        blockTag: BLOCK_HEIGHT,
      })
      expect(methContract.balanceOf).toHaveBeenCalledWith(DELAYED_WITHDRAW_ADDRESS, {
        blockTag: BLOCK_HEIGHT,
      })
      expect(methContract.balanceOf).toHaveBeenCalledTimes(2)
      expect(restakingPoolContract.balanceOf).toHaveBeenCalledWith(POSITION_MANAGER_ADDRESS, {
        blockTag: BLOCK_HEIGHT,
      })
      expect(restakingPoolContract.balanceOf).toHaveBeenCalledTimes(1)
      expect(positionManagerContract.getTotalLPT).toHaveBeenCalledWith({ blockTag: BLOCK_HEIGHT })
      expect(positionManagerContract.getTotalLPT).toHaveBeenCalledTimes(1)
      expect(positionManager2Contract.getTotalLPT).toHaveBeenCalledWith({ blockTag: BLOCK_HEIGHT })
      expect(positionManager2Contract.getTotalLPT).toHaveBeenCalledTimes(1)
      expect(cmethContract.totalSupply).toHaveBeenCalledWith({ blockTag: BLOCK_HEIGHT })
      expect(cmethContract.totalSupply).toHaveBeenCalledTimes(1)

      // Should create each contract only once.
      expect(ethers.Contract).toHaveBeenCalledWith(CMETH_ADDRESS, ERC20, ethProvider)
      expect(ethers.Contract).toHaveBeenCalledWith(METH_ADDRESS, ERC20, ethProvider)
      expect(ethers.Contract).toHaveBeenCalledWith(RESTAKING_POOL_ADDRESS, ERC20, ethProvider)
      expect(ethers.Contract).toHaveBeenCalledWith(
        POSITION_MANAGER_ADDRESS,
        PositionManagerOwnable2StepWithShortcut,
        ethProvider,
      )
      expect(ethers.Contract).toHaveBeenCalledWith(
        POSITION_MANAGER_2_ADDRESS,
        PositionManagerOwnable2StepWithShortcut,
        ethProvider,
      )
      expect(ethers.Contract).toHaveBeenCalledTimes(5)
    })

    it('should handle example input as a valid request', async () => {
      const cmethTotalSupply = 10000000n

      methContract.balanceOf.mockResolvedValue(0n)
      restakingPoolContract.balanceOf.mockResolvedValueOnce(0n)
      positionManagerContract.getTotalLPT.mockResolvedValueOnce(0n)
      positionManager2Contract.getTotalLPT.mockResolvedValueOnce(0n)
      cmethContract.totalSupply.mockResolvedValueOnce(cmethTotalSupply)

      await transport._handleRequest(inputParameters.examples![0])
    })

    describe('with invalid input', () => {
      it('should throw if address is missing', async () => {
        const param = makeStub('param', {
          addresses: [
            {
              name: 'cmETH',
              address: CMETH_ADDRESS,
            },
            {
              name: 'mETH',
              address: METH_ADDRESS,
            },
          ],
          balanceOf: [
            {
              tokenContract: 'mETH',
              account: 'BoringVault',
            },
          ],
          getTotalLPT: [],
        } as RequestParams)

        await expect(() => transport._handleRequest(param)).rejects.toThrow(
          "Address for 'BoringVault' not found in address map",
        )
      })

      it('should throw for duplicate address', async () => {
        const param = makeStub('param', {
          addresses: [
            {
              name: 'cmETH',
              address: CMETH_ADDRESS,
            },
            {
              name: 'mETH',
              address: METH_ADDRESS,
            },
            {
              name: 'BoringVault',
              address: BORING_VAULT_ADDRESS,
            },
            {
              name: 'boringvault',
              address: BORING_VAULT_ADDRESS,
            },
          ],
          balanceOf: [
            {
              tokenContract: 'mETH',
              account: 'BoringVault',
            },
          ],
          getTotalLPT: [],
        } as RequestParams)

        await expect(() => transport._handleRequest(param)).rejects.toThrow(
          "Duplicate address name: 'boringvault'",
        )
      })

      it('should throw for unused addresses', async () => {
        const boringVaultBalance = 987000n
        const cmethTotalSupply = 1000000n

        methContract.balanceOf.mockResolvedValueOnce(boringVaultBalance)
        cmethContract.totalSupply.mockResolvedValueOnce(cmethTotalSupply)

        const param = makeStub('param', {
          addresses: [
            {
              name: 'cmETH',
              address: CMETH_ADDRESS,
            },
            {
              name: 'mETH',
              address: METH_ADDRESS,
            },
            {
              name: 'BoringVault',
              address: BORING_VAULT_ADDRESS,
            },
            {
              name: 'DelayedWithdraw',
              address: DELAYED_WITHDRAW_ADDRESS,
            },
            {
              name: 'RestakingPool',
              address: RESTAKING_POOL_ADDRESS,
            },
          ],
          balanceOf: [
            {
              tokenContract: 'mETH',
              account: 'BoringVault',
            },
          ],
          getTotalLPT: [],
        } as RequestParams)

        await expect(() => transport._handleRequest(param)).rejects.toThrow(
          "Unused addresses found: 'DelayedWithdraw', 'RestakingPool'",
        )
      })
    })
  })

  describe('getBalances', () => {
    it('should return balances of named addresses', async () => {
      const blockHeight = 11111
      const boringVaultBalance = 987000n
      methContract.balanceOf.mockResolvedValueOnce(boringVaultBalance)

      const addressMap = {
        meth: {
          address: METH_ADDRESS,
          used: false,
          originalName: 'mETH',
        },
        boringvault: {
          address: BORING_VAULT_ADDRESS,
          used: false,
          originalName: 'BoringVault',
        },
      }

      const balances = await transport.getBalances(
        [
          {
            tokenContract: 'mETH',
            account: 'BoringVault',
          },
        ],
        addressMap,
        blockHeight,
      )

      expect(balances).toEqual({
        mETH: {
          BoringVault: boringVaultBalance,
        },
      })

      expect(methContract.balanceOf).toHaveBeenCalledWith(BORING_VAULT_ADDRESS, {
        blockTag: blockHeight,
      })
      expect(methContract.balanceOf).toHaveBeenCalledTimes(1)
    })

    it('should mark addresses as used', async () => {
      const boringVaultBalance = 987000n
      methContract.balanceOf.mockResolvedValueOnce(boringVaultBalance)

      const addressMap = {
        cmeth: {
          address: CMETH_ADDRESS,
          used: false,
          originalName: 'cmETH',
        },
        meth: {
          address: METH_ADDRESS,
          used: false,
          originalName: 'mETH',
        },
        boringvault: {
          address: BORING_VAULT_ADDRESS,
          used: false,
          originalName: 'BoringVault',
        },
      }

      await transport.getBalances(
        [
          {
            tokenContract: 'mETH',
            account: 'BoringVault',
          },
        ],
        addressMap,
        BLOCK_HEIGHT,
      )

      expect(addressMap['meth'].used).toBe(true)
      expect(addressMap['boringvault'].used).toBe(true)
      expect(addressMap['cmeth'].used).toBe(false)
    })
  })

  describe('getTotalLpts', () => {
    it('should return result of getTotalLPT of named contracts', async () => {
      const positionManagerLpt = 987000n
      positionManagerContract.getTotalLPT.mockResolvedValueOnce(positionManagerLpt)

      const addressMap = {
        positionmanager: {
          address: POSITION_MANAGER_ADDRESS,
          used: false,
          originalName: 'PositionManager',
        },
      }

      const totalLpts = await transport.getTotalLpts(['PositionManager'], addressMap, BLOCK_HEIGHT)

      expect(totalLpts).toEqual({
        PositionManager: positionManagerLpt,
      })

      expect(positionManagerContract.getTotalLPT).toHaveBeenCalledTimes(1)
    })

    it('should mark addresses as used', async () => {
      const positionManagerLpt = 987000n
      positionManagerContract.getTotalLPT.mockResolvedValueOnce(positionManagerLpt)

      const addressMap = {
        positionmanager: {
          address: POSITION_MANAGER_ADDRESS,
          used: false,
          originalName: 'PositionManager',
        },
        positionmanager2: {
          address: POSITION_MANAGER_2_ADDRESS,
          used: false,
          originalName: 'PositionManager2',
        },
      }

      await transport.getTotalLpts(['PositionManager'], addressMap, BLOCK_HEIGHT)

      expect(addressMap['positionmanager'].used).toBe(true)
      expect(addressMap['positionmanager2'].used).toBe(false)
    })
  })
})

describe('sumBigints', () => {
  it('should sum an array of BigInts', () => {
    expect(sumBigints([1n, 2n, 3n])).toBe(6n)
  })

  it('should not use number as intermediate result', () => {
    expect(sumBigints([1000000000000000000000000000000n, 2000000000000000000000000000001n])).toBe(
      3000000000000000000000000000001n,
    )
  })
})

describe('contractBalanceMapToString', () => {
  it('should convert the balances in a ContractBalanceMap to strings', () => {
    const map: ContractBalanceMap<bigint> = {
      contract1: {
        account1: 1000n,
        account2: 2000n,
      },
      contract2: {
        account3: 12345678901234567890n,
      },
    }
    const expectedMap: ContractBalanceMap<string> = {
      contract1: {
        account1: '1000',
        account2: '2000',
      },
      contract2: {
        account3: '12345678901234567890',
      },
    }
    expect(contractBalanceMapToString(map)).toEqual(expectedMap)
  })
})

describe('createAddressMap', () => {
  it('should convert a list of entries to an address map', () => {
    const list = [
      {
        name: 'cmETH',
        address: CMETH_ADDRESS,
      },
      {
        name: 'mETH',
        address: METH_ADDRESS,
      },
      {
        name: 'BoringVault',
        address: BORING_VAULT_ADDRESS,
      },
    ]
    expect(createAddressMap(list)).toEqual({
      cmeth: {
        address: CMETH_ADDRESS,
        used: false,
        originalName: 'cmETH',
      },
      meth: {
        address: METH_ADDRESS,
        used: false,
        originalName: 'mETH',
      },
      boringvault: {
        address: BORING_VAULT_ADDRESS,
        used: false,
        originalName: 'BoringVault',
      },
    })
  })
})
