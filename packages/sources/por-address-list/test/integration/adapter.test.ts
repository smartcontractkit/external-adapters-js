import { AdapterRequest } from '@chainlink/ea-bootstrap'
import { server as startServer } from '../../src'
import { ethers } from 'ethers'
import { setupExternalAdapterTest } from '@chainlink/ea-test-helpers'
import type { SuiteContext } from '@chainlink/ea-test-helpers'
import { SuperTest, Test } from 'supertest'

const mockExpectedAddresses = [
  '0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266',
  '0x70997970c51812dc3a010c7d01b50e0d17dc79c8',
  '0x3c44cdddb6a900fa2b585dd299e03d12fa4293bc',
  '0x90f79bf6eb2c4f870365e785982e1f101e93b906',
  '0x15d34aaf54267db7d7c367839aaf71a00a2c6a65',
  '0x9965507d1a55bcc2695c58ba16fb37d819b0a4dc',
  '0x976ea74026e726554db657fa54763abd0c3a0aa9',
  '0x14dc79964da2c08b23698b3d3cc7ca32193d9955',
  '0x23618e81e3f5cdf7f54c3d65f7fbc0abf5b21e8f',
  '0xa0ee7a142d267c1f36714e4a8f75612f20a79720',
]

const mockAddressListLength = ethers.BigNumber.from(mockExpectedAddresses.length)

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
          getPoRAddressListLength: jest.fn().mockReturnValue(mockAddressListLength),
          getPoRAddressList: jest.fn().mockReturnValue(mockExpectedAddresses),
        }
      },
    },
  }
})

describe('execute', () => {
  const id = '1'
  const context: SuiteContext = {
    req: null,
    server: startServer,
  }

  const envVariables = {
    RPC_URL: process.env.RPC_URL || 'http://localhost:8545',
  }

  setupExternalAdapterTest(envVariables, context)

  describe('addresses', () => {
    const data: AdapterRequest = {
      id,
      data: {
        contractAddress: '0x203E97cF02dB2aE52c598b2e5e6c6A778EB1987B',
        network: 'ethereum',
        chainId: 'mainnet',
      },
    }

    it('should return success', async () => {
      const response = await (context.req as SuperTest<Test>)
        .post('/')
        .send(data)
        .set('Accept', '*/*')
        .set('Content-Type', 'application/json')
        .expect('Content-Type', /json/)
        .expect(200)
      expect(response.body).toMatchSnapshot()
    })
  })
})
