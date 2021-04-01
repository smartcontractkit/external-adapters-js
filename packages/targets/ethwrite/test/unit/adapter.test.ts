import { Requester } from '@chainlink/ea-bootstrap'
import {
  assertError,
  assertSuccess,
  startChain,
  TESTING_PRIVATE_KEY,
} from '@chainlink/ea-test-helpers'
import { AdapterRequest, AdapterRequestMeta, AdapterResponse } from '@chainlink/types'
import { ethers } from 'ethers'
import { makeExecute } from '../../src/adapter'
import { abi, deploy } from '../helpers'
jest.setTimeout(100000)
let chain: any
let rpcUrl: string | ethers.utils.ConnectionInfo
let address: string
let provider: ethers.providers.Provider | ethers.Signer
let contract: ethers.Contract
let execute: {
  (arg0: { id: string; data: Record<string, unknown>; meta: AdapterRequestMeta }): any
  (input: AdapterRequest): Promise<AdapterResponse>
}

describe('execute', () => {
  beforeAll(async () => {
    chain = await startChain(4444)
    rpcUrl = 'http://localhost:4444'
    address = await deploy(TESTING_PRIVATE_KEY, rpcUrl)
    provider = new ethers.providers.JsonRpcProvider(rpcUrl)
    contract = new ethers.Contract(address, abi, provider)
    execute = makeExecute({ rpcUrl, privateKey: TESTING_PRIVATE_KEY, api: {} })
  })

  afterAll(async () => {
    await chain.close()
  })
  const jobID = '278c97ffadb54a5bbb93cfec5f7b5503'
  const bytes32FuncId = '0xc2b12a73'
  const int256FuncId = '0xa53b1c1e'
  const uint256FuncId = '0xd2282dc5'
  describe('successfully writes uint', () => {
    const requests = [
      {
        name: 'without already encoded integer',
        uncodedResult: 42,
        testData: {
          id: jobID,
          data: {
            funcId: uint256FuncId,
            result: ethers.utils.defaultAbiCoder.encode(['uint256'], [42]).slice(2),
          },
        },
      },
      {
        name: 'with specifying dataToSend instead of result',
        uncodedResult: 12,
        testData: {
          id: jobID,
          data: {
            funcId: uint256FuncId,
            dataType: 'uint256',
            dataToSend: 12,
          },
        },
      },
    ]
    requests.forEach((req) => {
      it(`${req.name}`, async () => {
        const data = await execute({
          ...req.testData,
          data: { ...req.testData.data, exAddr: address },
        } as AdapterRequest)
        const contractReadResultUint = await contract.getUint256()
        assertSuccess({ expected: 200, actual: data.statusCode }, data, jobID)
        expect(data.jobRunID).toEqual(jobID)
        expect(req.uncodedResult).toEqual(contractReadResultUint.toNumber())
        expect(Object.keys(data.data).length).toBeGreaterThan(0)
      })
    })
  })

  describe('successfully writes int', () => {
    const requests = [
      {
        name: 'with already encoded negative number',
        uncodedResult: -42,
        testData: {
          id: jobID,
          data: {
            exAddr: address,
            funcId: int256FuncId,
            result: ethers.utils.defaultAbiCoder.encode(['int256'], [-42]).slice(2),
          },
        },
      },
      {
        name: 'with specifying dataToSend instead of result',
        uncodedResult: 42,
        testData: {
          id: jobID,
          data: {
            exAddr: address,
            funcId: int256FuncId,
            dataType: 'int256',
            dataToSend: 42,
          },
        },
      },
    ]

    requests.forEach((req) => {
      console.log(req)
      it(`${req.name}`, async () => {
        const data = await execute({
          ...req.testData,
          data: { ...req.testData.data, exAddr: address },
        } as AdapterRequest)
        const contractReadResultInt = await contract.getInt256()
        assertSuccess({ expected: 200, actual: data.statusCode }, data, jobID)
        expect(data.jobRunID).toEqual(jobID)
        expect(req.uncodedResult).toEqual(contractReadResultInt.toNumber())
        expect(Object.keys(data.data).length).toBeGreaterThan(0)
      })
    })
  })

  describe('successfully writes bytes32', () => {
    const uncodedResult = 'hello world'
    const requests = [
      {
        name: 'with already encoded string',
        uncodedResult,
        testData: {
          id: jobID,
          data: {
            exAddr: address,
            funcId: bytes32FuncId,
            result: ethers.utils.formatBytes32String(uncodedResult).slice(2),
          },
        },
      },
    ]
    requests.forEach((req) => {
      console.log(req)
      it(`${req.name}`, async () => {
        const data = await execute({
          ...req.testData,
          data: { ...req.testData.data, exAddr: address },
        } as AdapterRequest)
        const contractReadResultBytes = await contract.getBytes32()

        assertSuccess({ expected: 200, actual: data.statusCode }, data, jobID)
        expect(data.jobRunID).toEqual(jobID)
        expect(req.uncodedResult).toEqual(ethers.utils.parseBytes32String(contractReadResultBytes))
        expect(Object.keys(data.data).length).toBeGreaterThan(0)
      })
    })
  })

  describe('validation error', () => {
    const requests = [
      { name: 'empty body', testData: {} },
      { name: 'empty data', testData: { data: {} } },
    ]

    requests.forEach((req) => {
      it(`${req.name}`, async () => {
        try {
          await execute({
            id: '',
            ...req.testData,
            data: { ...req.testData.data, exAddr: address },
          } as AdapterRequest)
        } catch (error) {
          const errorResp = Requester.errored(jobID, error)
          assertError({ expected: 400, actual: errorResp.statusCode }, errorResp, jobID)
        }
      })
    })
  })
})
