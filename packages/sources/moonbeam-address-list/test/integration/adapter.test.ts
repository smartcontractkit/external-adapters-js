import {
  TestAdapter,
  setEnvVariables,
} from '@chainlink/external-adapter-framework/util/testing-utils'

const mockExpectedAddresses = [
  '0x7b67aa8a28a9df5f4a47f364d3d3a4109f009d11d124c5a7babcbf23e653857b',
  '0x30b3e731516319546280d5e77da965ffa33d3aae09b98a4073ffa616c865086f',
  '0xd996fdee462b0e14181c4e12c06639467f74ce6e4a012b4648868fa83cbccd01',
]

jest.mock('ethers', () => {
  const actualModule = jest.requireActual('ethers')
  return {
    ...actualModule,
    ethers: {
      ...actualModule.ethers,
      providers: {
        JsonRpcProvider: function () {
          return {
            getBlockNumber: jest.fn().mockReturnValue(1000),
          }
        },
      },
      Contract: function () {
        return {
          getStashAccounts: jest.fn().mockImplementation(() => mockExpectedAddresses),
        }
      },
    },
  }
})

describe('execute', () => {
  let spy: jest.SpyInstance
  let testAdapter: TestAdapter
  let oldEnv: NodeJS.ProcessEnv

  beforeAll(async () => {
    oldEnv = JSON.parse(JSON.stringify(process.env))
    process.env['RPC_URL'] = 'http://localhost:9091'
    const mockDate = new Date('2022-08-01T07:14:54.909Z')
    spy = jest.spyOn(Date, 'now').mockReturnValue(mockDate.getTime())

    const adapter = (await import('./../../src')).adapter
    testAdapter = await TestAdapter.startWithMockedCache(adapter, {
      testAdapter: {} as TestAdapter<never>,
    })
  })

  afterAll(async () => {
    setEnvVariables(oldEnv)
    spy.mockRestore()
    await testAdapter.api.close()
  })

  it('addresses should return success', async () => {
    const data = { network: 'moonbeam', chainId: 'mainnet' }
    const response = await testAdapter.request(data)
    expect(response.statusCode).toBe(200)
    expect(response.json()).toMatchSnapshot()
  })
})
