import {
  setEnvVariables,
  TestAdapter,
} from '@chainlink/external-adapter-framework/util/testing-utils'
import * as nock from 'nock'

import { ethers } from 'ethers'

import {
  ETHERFI_SUCCESS_NO_QUEUED_CONFIG,
  ETHERFI_SUCCESS_WITH_QUEUED_CONFIG,
  ETHERFI_TEST_PARAMS,
  mockEtherFiSuccessNoQueued,
  mockEtherFiSuccessWithQueued,
} from './fixtures'

describe('execute', () => {
  let testAdapter: TestAdapter
  let oldEnv: NodeJS.ProcessEnv
  let spy: jest.SpyInstance

  const baseParams = {
    endpoint: 'etherFi',
    splitMain: ETHERFI_TEST_PARAMS.splitMain,
    splitMainAccount: ETHERFI_TEST_PARAMS.splitMainAccount,
    eigenStrategy: ETHERFI_TEST_PARAMS.eigenStrategy,
    eigenStrategyUser: ETHERFI_TEST_PARAMS.eigenStrategyUser,
    eigenPodManager: ETHERFI_TEST_PARAMS.eigenPodManager,
  }

  beforeAll(async () => {
    oldEnv = JSON.parse(JSON.stringify(process.env))

    process.env.ETHEREUM_RPC_URL =
      process.env.ETHEREUM_RPC_URL ?? 'http://localhost-eth-mainnet:8080'
    process.env.ETHEREUM_RPC_CHAIN_ID = process.env.ETHEREUM_RPC_CHAIN_ID ?? '1'
    process.env.BACKGROUND_EXECUTE_MS = '0'

    const mockDate = new Date('2001-01-01T11:11:11.111Z')
    spy = jest.spyOn(Date, 'now').mockReturnValue(mockDate.getTime())

    const adapter = (await import('./../../src')).adapter
    adapter.rateLimiting = undefined

    testAdapter = await TestAdapter.startWithMockedCache(adapter, {
      testAdapter: {} as TestAdapter<never>,
    })
  })

  afterEach(async () => {
    testAdapter.mockCache?.cache.clear()
    nock.cleanAll()
  })

  afterAll(async () => {
    nock.restore()
    spy.mockRestore()
    setEnvVariables(oldEnv)
    await testAdapter.api.close()
  })

  describe('etherFi endpoint', () => {
    describe('happy path', () => {
      it('returns success without queued withdrawals', async () => {
        let sharesToUnderlyingCallData: string | undefined
        mockEtherFiSuccessNoQueued({
          onSharesToUnderlyingCall: (data) => {
            sharesToUnderlyingCallData = data
          },
        })

        const response = await testAdapter.request(baseParams)

        expect(sharesToUnderlyingCallData).toBeDefined()
        expect(response.statusCode).toBe(200)
        const expectedTotalShares = ETHERFI_SUCCESS_NO_QUEUED_CONFIG.strategyShares
        const expectedCallData = new ethers.Interface([
          'function sharesToUnderlyingView(uint256 amountShares) view returns (uint256)',
        ]).encodeFunctionData('sharesToUnderlyingView', [expectedTotalShares])
        expect(sharesToUnderlyingCallData).toBe(expectedCallData)
        expect(response.json()).toMatchSnapshot()
      })

      it('returns success including queued withdrawal shares', async () => {
        let sharesToUnderlyingCallData: string | undefined
        mockEtherFiSuccessWithQueued({
          onSharesToUnderlyingCall: (data) => {
            sharesToUnderlyingCallData = data
          },
        })

        const response = await testAdapter.request(baseParams)

        expect(response.statusCode).toBe(200)
        expect(response.json()).toMatchSnapshot()

        expect(sharesToUnderlyingCallData).toBeDefined()
        const expectedTotalShares =
          ETHERFI_SUCCESS_WITH_QUEUED_CONFIG.strategyShares +
          ETHERFI_SUCCESS_WITH_QUEUED_CONFIG.queuedShares!.flat().reduce(
            (acc, val) => acc + val,
            0n,
          )
        const expectedCallData = new ethers.Interface([
          'function sharesToUnderlyingView(uint256 amountShares) view returns (uint256)',
        ]).encodeFunctionData('sharesToUnderlyingView', [expectedTotalShares])
        expect(sharesToUnderlyingCallData).toBe(expectedCallData)
      })
    })

    describe('validation errors', () => {
      it('fails when required fields are missing', async () => {
        const response = await testAdapter.request({ endpoint: 'etherfi' })

        expect(response.statusCode).toBe(400)
        expect(response.json()).toMatchSnapshot()
      })
    })
  })
})
