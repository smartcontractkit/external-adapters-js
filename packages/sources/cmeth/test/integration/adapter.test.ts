import {
  TestAdapter,
  setEnvVariables,
} from '@chainlink/external-adapter-framework/util/testing-utils'
import * as nock from 'nock'
import {
  BORING_VAULT_ADDRESS,
  CMETH_ADDRESS,
  DELAYED_WITHDRAW_ADDRESS,
  METH_ADDRESS,
  POSITION_MANAGER_KARAK_ADDRESS,
  V1_POSITION_MANAGER_EIGEN_A41_ADDRESS,
  V1_POSITION_MANAGER_EIGEN_P2P_ADDRESS,
  V1_POSITION_MANAGER_SYMBIOTIC_ADDRESS,
  V1_SYMBIOTIC_RESTAKING_POOL_ADDRESS,
  V2_POSITION_MANAGER_EIGEN_A41_ADDRESS,
  V2_POSITION_MANAGER_EIGEN_P2P_ADDRESS,
  V2_POSITION_MANAGER_SYMBIOTIC_ADDRESS,
  mockEthereumRpc,
} from './fixtures'

describe('execute', () => {
  let spy: jest.SpyInstance
  let testAdapter: TestAdapter
  let oldEnv: NodeJS.ProcessEnv

  beforeAll(async () => {
    oldEnv = JSON.parse(JSON.stringify(process.env))
    process.env.ETHEREUM_RPC_URL = 'http://localhost-eth-mainnet:8080'
    process.env.ETHEREUM_RPC_CHAIN_ID = '1'
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
    nock.restore()
    nock.cleanAll()
    spy.mockRestore()
  })

  describe('price endpoint', () => {
    it('should return success', async () => {
      const data = {
        addresses: [
          { name: 'cmETH', address: CMETH_ADDRESS },
          { name: 'mETH', address: METH_ADDRESS },
          { name: 'BoringVault', address: BORING_VAULT_ADDRESS },
          { name: 'DelayedWithdraw', address: DELAYED_WITHDRAW_ADDRESS },
          { name: 'PositionManager-Karak', address: POSITION_MANAGER_KARAK_ADDRESS },
          {
            name: 'V1:PositionManager-Symbiotic',
            address: V1_POSITION_MANAGER_SYMBIOTIC_ADDRESS,
          },
          {
            name: 'V1:PositionManager-Eigen_A41',
            address: V1_POSITION_MANAGER_EIGEN_A41_ADDRESS,
          },
          {
            name: 'V1:PositionManager-Eigen_P2P',
            address: V1_POSITION_MANAGER_EIGEN_P2P_ADDRESS,
          },
          {
            name: 'V1:SymbioticRestakingPool',
            address: V1_SYMBIOTIC_RESTAKING_POOL_ADDRESS,
          },
          {
            name: 'V2:PositionManager-Symbiotic',
            address: V2_POSITION_MANAGER_SYMBIOTIC_ADDRESS,
          },
          {
            name: 'V2:PositionManager-Eigen_A41',
            address: V2_POSITION_MANAGER_EIGEN_A41_ADDRESS,
          },
          {
            name: 'V2:PositionManager-Eigen_P2P',
            address: V2_POSITION_MANAGER_EIGEN_P2P_ADDRESS,
          },
        ],
        balanceOf: [
          {
            tokenContract: 'mETH',
            account: 'BoringVault',
          },
          {
            tokenContract: 'mETH',
            account: 'PositionManager-Karak',
          },
          {
            tokenContract: 'mETH',
            account: 'V1:PositionManager-Symbiotic',
          },
          {
            tokenContract: 'mETH',
            account: 'V1:PositionManager-Eigen_A41',
          },
          {
            tokenContract: 'mETH',
            account: 'V1:PositionManager-Eigen_P2P',
          },
          {
            tokenContract: 'mETH',
            account: 'V2:PositionManager-Symbiotic',
          },
          {
            tokenContract: 'mETH',
            account: 'V2:PositionManager-Eigen_A41',
          },
          {
            tokenContract: 'mETH',
            account: 'V2:PositionManager-Eigen_P2P',
          },
          {
            tokenContract: 'V1:SymbioticRestakingPool',
            account: 'V1:PositionManager-Symbiotic',
          },
          {
            tokenContract: 'mETH',
            account: 'DelayedWithdraw',
          },
        ],
        getTotalLPT: [
          'PositionManager-Karak',
          'V1:PositionManager-Eigen_A41',
          'V1:PositionManager-Eigen_P2P',
          'V2:PositionManager-Symbiotic',
          'V2:PositionManager-Eigen_A41',
          'V2:PositionManager-Eigen_P2P',
        ],
      }
      mockEthereumRpc()
      const response = await testAdapter.request(data)
      expect(response.statusCode).toBe(200)
      expect(response.json()).toMatchSnapshot()
    })
  })
})
