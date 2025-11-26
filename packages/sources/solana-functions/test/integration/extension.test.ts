import {
  TestAdapter,
  makeStub,
  setEnvVariables,
} from '@chainlink/external-adapter-framework/util/testing-utils'
import * as galaxyMinterAccountData from '../fixtures/galaxy-digital-inc-account-data-2025-11-07.json'

const galaxyMinterAddress = '2HehXG149TXuVptQhbiWAWDjbbuCsXSAtLTB5wc2aajK'

const solanaRpc = makeStub('solanaRpc', {
  getAccountInfo: (address: string) => ({
    async send() {
      switch (address) {
        case galaxyMinterAddress:
          return galaxyMinterAccountData.result
      }
      throw new Error(`Unexpected account address: ${address}`)
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

  describe('extension', () => {
    it('should return scaled UI amount fields', async () => {
      const data = {
        endpoint: 'extension',
        stateAccountAddress: galaxyMinterAddress,
        baseFields: [
          {
            name: 'supply',
            offset: 36,
            type: 'uint64',
          },
        ],
        extensionFields: [
          {
            extensionType: 25,
            name: 'currentMultiplier',
            offset: 32,
            type: 'float64',
          },
          {
            extensionType: 25,
            name: 'newMultiplier',
            offset: 48,
            type: 'float64',
          },
          {
            extensionType: 25,
            name: 'activationDateTime',
            offset: 40,
            type: 'int64',
          },
        ],
      }
      const response = await testAdapter.request(data)
      expect(response.json()).toMatchSnapshot()
      expect(response.statusCode).toBe(200)
    })
  })
})
