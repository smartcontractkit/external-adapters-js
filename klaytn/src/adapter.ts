import { Requester, Validator } from '@chainlink/external-adapter'
import { Config, ExecuteWithConfig, ExecuteFactory } from '@chainlink/types'
import { makeConfig } from './config'
import { txResult } from './types'
import fs from 'fs'

const Caver = require('caver-js')
const caver = new Caver(process.env.URL)

const privateKey = process.env.PRIVATE_KEY
const keyring = caver.wallet.keyring.createFromPrivateKey(privateKey)
caver.wallet.add(keyring)

const sendFulfillment = async (address: string, logData: string, topics: string, value: string) => {
  const decoded = caver.abi.decodeLog(
    JSON.parse(fs.readFileSync('./OracleRequestABI.json').toString()),
    logData,
    topics,
  )

  console.log('[Decoded Data] \n', decoded)

  const functionSelector = caver.abi.encodeFunctionSignature(
    'fulfillOracleRequest(bytes32,uint256,address,bytes4,uint256,bytes32)',
  )

  const requestId = decoded.requestId
  const payment = decoded.payment
  const callbackAddr = decoded.callbackAddr
  const callbackFunctionId = decoded.callbackFunctionId
  const expiration = decoded.cancelExpiration

  if (!isNaN(+value)) {
    // if number
    value = caver.utils.numberToHex(value)
  } else if (value.substring(0, 2) != '0x') {
    // if string
    value = caver.utils.stringToHex(value)
  }

  console.log('result: ', value)

  const param = caver.abi
    .encodeParameters(
      ['bytes32', 'uint256', 'address', 'bytes4', 'uint256', 'bytes32'],
      [
        requestId,
        payment,
        callbackAddr,
        callbackFunctionId,
        expiration,
        caver.utils.leftPad(value, 64),
      ],
    )
    .substring(2)

  const tx = new caver.transaction.legacyTransaction({
    from: keyring.toAccount()._address,
    to: address,
    input: functionSelector.concat(param),
    gas: 1500000,
  })

  return await caver.wallet.sign(keyring.address, tx).then(caver.rpc.klay.sendRawTransaction)
}

const customParams = {
  address: ['address'],
  data: ['data'],
  topics: ['topics'],
  value: ['result', 'value'],
}

export const execute: ExecuteWithConfig<Config> = async (request, config) => {
  console.log('[Received Data] \n', request)
  const validator = new Validator(request, customParams)
  if (validator.error) throw validator.error

  Requester.logConfig(config)

  const jobRunID = validator.validated.id
  const address = validator.validated.data.address
  const data = validator.validated.data.data
  const topcis = validator.validated.data.data
  const value = validator.validated.data.value

  try {
    const tx: txResult = await sendFulfillment(address, data, topcis, JSON.parse(value).result)

    console.log('[Success] ', tx)

    return Requester.success(jobRunID, {
      data: { result: tx.transactionHash },
      result_tx: tx.transactionHash,
      status: 200,
    })
  } catch (e) {
    console.error(e)
    return Requester.errored(jobRunID, e)
  }
}

export const makeExecute: ExecuteFactory<Config> = (config) => {
  return async (request) => execute(request, config || makeConfig())
}
