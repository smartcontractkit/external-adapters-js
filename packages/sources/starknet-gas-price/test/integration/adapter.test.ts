import * as nock from 'nock'
import {
  TestAdapter,
  setEnvVariables,
} from '@chainlink/external-adapter-framework/util/testing-utils'
import { RpcProvider, PendingBlock } from 'starknet'

describe('execute', () => {
  let spy: jest.SpyInstance
  let testAdapter: TestAdapter
  let oldEnv: NodeJS.ProcessEnv

  beforeAll(async () => {
    oldEnv = JSON.parse(JSON.stringify(process.env))
    process.env.BACKGROUND_EXECUTE_MS = '0'
    process.env.STARKNET_RPC_URL = 'https://test-rpc-url-starknet.com'

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

  describe('gasprice endpoint', () => {
    it('should return success', async () => {
      // mock the starknet.js provider directly
      jest.spyOn(RpcProvider.prototype, 'getBlock').mockResolvedValue({
        status: 'PENDING',
        l1_da_mode: 'BLOB',
        l1_data_gas_price: { price_in_fri: '0x2daa35d3076ec4', price_in_wei: '0x3bde2d6cc47' },
        l1_gas_price: { price_in_fri: '0x2d7e8782b50', price_in_wei: '0x3ba4e91d' },
        parent_hash: '0x5c14708b125390d092c83f2561ed6278fce3c16540d0b9429b00eff32bdc7c2',
        sequencer_address: '0x1176a1bd84444c89232ec27754698e5d2e7e1a7f1539f12027f28b23ec9f3d8',
        starknet_version: '0.13.1.1',
        timestamp: 1717104546,
        transactions: [
          '0x7fb1a6ab95d283a56cd0d30f0fdfe4eed15543da9529ede1698a8b1b0bb57e1',
          '0x460809d209b4174fb005c76a210c86d7d50d1b4209df935b8d2ce3bbafd19d5',
          '0x70e841662b27cffdbf4c0ce1446d8ff42f843a8424ef6e6fb90c5c0a4e2bfd4',
          '0xd330e47ca906e59c597f55dcc647aff2ddb85936b203a6fd3d98f09c5d6728',
          '0x782e010e65ea252a86ee7d4380c64d6c294c759e2e803d454325428c07ea37',
          '0x679c2c91d6224107d7faddfa9812362e716d18e5c34e5c6eac24199ae272136',
          '0x150e4259dd0d7e6c2cbf84420e16af0cb13c1cc8d20f671ff528658ac995ebf',
          '0x3283068f2b2fd0fcb5432dff3a0255cc8baece8dc6af6ec6d9f11331844c749',
        ],
      } as unknown as PendingBlock)

      const expectedResult = {
        data: { result: '3126341413712' }, // price_in_fri: '0x2d7e8782b50' converted to decimal string representation
        statusCode: 200,
        result: '3126341413712', // price_in_fri: '0x2d7e8782b50' converted to decimal string representation
        timestamps: {
          providerDataRequestedUnixMs: 978347471111, // the mocked date in ms
          providerDataReceivedUnixMs: 978347471111, // the mocked date in ms
        },
      }

      const data = {}
      const response = await testAdapter.request(data)
      expect(response.statusCode).toBe(200)
      // match checks that expected result is a subset of the actual response
      expect(response.json()).toMatchObject(expectedResult)
    })
  })
})
