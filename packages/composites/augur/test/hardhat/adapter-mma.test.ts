import { AdapterError, Requester } from '@chainlink/ea-bootstrap'
import { assertError, assertSuccess } from '@chainlink/ea-test-helpers'
import { AdapterContext, AdapterRequest } from '@chainlink/types'
import { execute } from '../../src/adapter'
import MockDate from 'mockdate'
import server from '../utils/data-server'
import { Server } from 'http'
import { ethers, deployments, getNamedAccounts } from 'hardhat'
import { Contract } from 'ethers'
import { Config } from '../../src/config'
import { expect, spy } from './chai-setup'

describe('createMarket execute', () => {
  const jobID = '1'
  let mockDataServer: Server

  // process.env.RPC_URL = "http://127.0.0.1:8545";
  // process.env.PRIVATE_KEY = "ac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80";

  describe('successful calls @integration', () => {
    let mmaMarketFactory: Contract
    let config: Config

    before(async () => {
      process.env.SPORTSDATAIO_MMA_STATS_API_KEY = 'key'
      process.env.SPORTSDATAIO_API_ENDPOINT = 'http://127.0.0.1:3000'
      // run mock server;
      mockDataServer = server.listen(3000)

      // deploy smart contract
      await deployments.fixture(['Sports'])

      // fetch the MMA market factory.
      mmaMarketFactory = await ethers.getContract('MMAMarketFactory')

      const { deployer } = await getNamedAccounts()
      const signer = await ethers.getSigner(deployer)
      config = {
        ...Requester.getDefaultConfig(''),
        verbose: true,
        signer,
      }
    })

    after(() => {
      return mockDataServer.close()
    })

    let Dates = ['2021-01-16T12:00:00']

    Dates.forEach((date) => {
      MockDate.set(date)
      it(`${date} create`, async () => {
        let testData = {
          id: jobID,
          data: {
            method: 'create',
            sport: 'MMA',
            daysInAdvance: 1,
            startBuffer: 60,
            affiliateIds: [1, 3],
            contractAddress: mmaMarketFactory.address,
          },
        }

        const data = await execute(testData as AdapterRequest, {} as AdapterContext, config)
      })
      MockDate.reset()
    })

    Dates.forEach((date) => {
      MockDate.set(date)
      it(`${date} resolve`, async () => {
        let testData = {
          id: jobID,
          data: {
            method: 'resolve',
            sport: 'MMA',
            contractAddress: mmaMarketFactory.address,
          },
        }

        const data = await execute(testData as AdapterRequest, {} as AdapterContext, config)
      })
      MockDate.reset()
    })
  })

  describe('error calls @integration', () => {
    const requests = [
      {
        name: 'not supplied method',
        testData: {
          id: jobID,
          data: {},
        },
      },
    ]

    // requests.forEach((req) => {
    // 	it(`${req.name}`, async () => {
    // 		try {
    // 			await execute(req.testData as AdapterRequest, {} as AdapterContext, config);
    // 		} catch (error) {
    // 			const errorResp = Requester.errored(jobID, error)
    // 			assertError({ expected: 400, actual: errorResp.statusCode }, errorResp, jobID)
    // 		}
    // 	})
    // })
  })
})
