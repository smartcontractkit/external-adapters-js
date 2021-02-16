import { assert } from 'chai'
import { Requester } from '@chainlink/external-adapter'
import { assertSuccess, assertError, startChain } from '@chainlink/adapter-test-helpers'
import { AdapterRequest } from '@chainlink/types'
import { makeExecute } from '../src/adapter'
import { deploy } from '../deploy_contract'
import { abi } from '../read_contract'
import { ethers } from 'ethers'
import { default as hardhatConfig } from '../../hardhat.config'

// using DELAYED ROOT SUITE in order to start the chain and deploy the contract
setTimeout(async function () {
  const chain = await startChain(4444)
  const rpcUrl = 'http://localhost:4444'
  const address = await deploy(hardhatConfig.networks.hardhat.accounts[0].privateKey, rpcUrl)
  const provider = new ethers.providers.JsonRpcProvider(rpcUrl)
  const contract = new ethers.Contract(address, abi, provider)

  describe('execute', async () => {
    const execute = makeExecute()
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
          name: 'without specifying the data type',
          testData: {
            id: jobID,
            data: {
              exAddr: address,
              funcId: uint256FuncId,
              result: '54',
            },
          },
        },
        {
          name: 'with specifying uint256',
          testData: {
            id: jobID,
            data: {
              exAddr: address,
              dataType: 'uint256',
              funcId: uint256FuncId,
              result: 42,
            },
          },
        },
        {
          name: 'with specifying dataToSend instead of result',
          testData: {
            id: jobID,
            data: {
              exAddr: address,
              dataType: 'uint256',
              funcId: uint256FuncId,
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
          assert.equal(
            req.testData.data.result || req.testData.data.dataToSend,
            contractReadResultUint.toNumber(),
          )
          assert.isNotEmpty(data.data)
        })
      })
    })

    context('successfully writes int', async () => {
      const requests = [
        {
          name: 'without specifying the data type',
          testData: {
            id: jobID,
            data: {
              exAddr: address,
              funcId: int256FuncId,
              result: '54',
            },
          },
        },
        {
          name: 'with specifying int256',
          testData: {
            id: jobID,
            data: {
              exAddr: address,
              dataType: 'int256',
              funcId: int256FuncId,
              result: 42,
            },
          },
        },
        {
          name: 'with specifying dataToSend instead of result',
          testData: {
            id: jobID,
            data: {
              exAddr: address,
              dataType: 'uint256',
              funcId: int256FuncId,
              dataToSend: 12,
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
          assert.equal(
            req.testData.data.result || req.testData.data.dataToSend,
            contractReadResultInt.toNumber(),
          )
          assert.isNotEmpty(data.data)
        })
      })
    })

    context('successfully writes bytes32', async () => {
      const requests = [
        {
          name: 'with specifying bytes32',
          testData: {
            id: jobID,
            data: {
              exAddr: address,
              dataType: 'bytes32',
              funcId: bytes32FuncId,
              result: 'hello world',
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
          assert.equal(
            req.testData.data.result,
            ethers.utils.parseBytes32String(contractReadResultBytes),
          )
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
