import { assert } from 'chai'
import { Requester } from '@chainlink/ea-bootstrap'
import {
  assertSuccess,
  assertError,
  startChain,
  TESTING_PRIVATE_KEY,
} from '@chainlink/ea-test-helpers'
import { AdapterRequest } from '@chainlink/types'
import { makeExecute } from '../src/adapter'
import { abi, deploy } from './helpers'
import { ethers } from 'ethers'

// using DELAYED ROOT SUITE in order to start the chain and deploy the contract
setTimeout(async function () {
  const chain = await startChain(4444)
  const rpcUrl = 'http://localhost:4444'
  const address = await deploy(TESTING_PRIVATE_KEY, rpcUrl)
  const provider = new ethers.providers.JsonRpcProvider(rpcUrl)
  const contract = new ethers.Contract(address, abi, provider)

  describe('execute', async () => {
    const execute = makeExecute({ rpcUrl, privateKey: TESTING_PRIVATE_KEY, api: {} })
    after(async () => {
      await chain.close()
    })
    const jobID = '278c97ffadb54a5bbb93cfec5f7b5503'
    const bytes32FuncId = '0xc2b12a73'
    const int256FuncId = '0xa53b1c1e'
    const uint256FuncId = '0xd2282dc5'
    context('successfully writes uint', async () => {
      const requests = [
        {
          name: 'without already encoded integer',
          uncodedResult: 42,
          testData: {
            id: jobID,
            data: {
              exAddr: address,
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
              exAddr: address,
              funcId: uint256FuncId,
              dataType: 'uint256',
              dataToSend: 12,
            },
          },
        },
      ]

      requests.forEach((req) => {
        console.log(req)
        it(`${req.name}`, async () => {
          const data = await execute(req.testData as AdapterRequest)
          const contractReadResultUint = await contract.getUint256()
          assertSuccess({ expected: 200, actual: data.statusCode }, data, jobID)
          assert.equal(data.jobRunID, jobID)
          assert.equal(req.uncodedResult, contractReadResultUint.toNumber())
          assert.isNotEmpty(data.data)
        })
      })
    })

    context('successfully writes int', async () => {
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
          const data = await execute(req.testData as AdapterRequest)
          const contractReadResultInt = await contract.getInt256()
          assertSuccess({ expected: 200, actual: data.statusCode }, data, jobID)
          assert.equal(data.jobRunID, jobID)
          assert.equal(req.uncodedResult, contractReadResultInt.toNumber())
          assert.isNotEmpty(data.data)
        })
      })
    })

    context('successfully writes bytes32', async () => {
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
          const data = await execute(req.testData as AdapterRequest)
          const contractReadResultBytes = await contract.getBytes32()

          assertSuccess({ expected: 200, actual: data.statusCode }, data, jobID)
          assert.equal(data.jobRunID, jobID)
          assert.equal(req.uncodedResult, ethers.utils.parseBytes32String(contractReadResultBytes))
          assert.isNotEmpty(data.data)
        })
      })
    })

    context('validation error', () => {
      const requests = [
        { name: 'empty body', testData: {} },
        { name: 'empty data', testData: { data: {} } },
      ]

      requests.forEach((req) => {
        it(`${req.name}`, async () => {
          try {
            await execute(req.testData as AdapterRequest)
          } catch (error) {
            const errorResp = Requester.errored(jobID, error)
            assertError({ expected: 400, actual: errorResp.statusCode }, errorResp, jobID)
          }
        })
      })
    })

    context('error calls @integration', () => {
      const requests = [
        {
          name: 'with sending string while int datatype and func',
          testData: {
            id: jobID,
            data: {
              exAddr: address,
              dataType: 'int256',
              funcId: int256FuncId,
              dataToSend: 'not correct',
            },
          },
        },
        {
          name: 'with specifying uint256 and negative result',
          testData: {
            id: jobID,
            data: {
              exAddr: address,
              dataType: 'uint256',
              funcId: uint256FuncId,
              result: -42,
            },
          },
        },
      ]
      requests.forEach((req) => {
        it(`${req.name}`, async () => {
          try {
            await execute(req.testData as AdapterRequest)
          } catch (error) {
            const errorResp = Requester.errored(jobID, error)
            assertError({ expected: 500, actual: errorResp.statusCode }, errorResp, jobID)
          }
        })
      })
    })
  })
  run()
}, 1000)
