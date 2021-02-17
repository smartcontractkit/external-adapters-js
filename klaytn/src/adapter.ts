import { Requester, Validator, AdapterError } from '@chainlink/external-adapter'
import { Config, ExecuteWithConfig, ExecuteFactory, AdapterResponse } from '@chainlink/types'
import { makeConfig } from './config'
import { LegacyTransaction } from './types'
import fs from 'fs'

const Caver = require('caver-js')
const caver = new Caver(process.env.URL)

const privateKey = process.env.PRIVATE_KEY
const keyring = caver.wallet.keyring.createFromPrivateKey(privateKey)
caver.wallet.add(keyring)

const sendFulfillment = async (
  address: string,
  logData: string,
  topics: string,
  value: string,
  callback: (txhash: string, e?: Error) => Promise<AdapterResponse>,
) => {
  // decode data in log
  const decoded = caver.abi.decodeLog(
    JSON.parse(fs.readFileSync('./OracleRequestABI.json').toString()),
    logData,
    topics,
  )
  console.log('[Decoded Data] \n', decoded)

  // get function selector
  const functionSelector = caver.abi.encodeFunctionSignature(
    'fulfillOracleRequest(bytes32,uint256,address,bytes4,uint256,bytes32)',
  )

  // convert value to hex
  if (!isNaN(+value)) {
    // if number
    value = caver.utils.numberToHex(value)
  } else if (value.substring(0, 2) != '0x') {
    // if string
    value = caver.utils.stringToHex(value)
  }

  // encode params
  const params = caver.abi
    .encodeParameters(
      ['bytes32', 'uint256', 'address', 'bytes4', 'uint256', 'bytes32'],
      [
        decoded.requestId,
        decoded.payment,
        decoded.callbackAddr,
        decoded.callbackFunctionId,
        decoded.cancelExpiration,
        caver.utils.leftPad(value, 64),
      ],
    )
    .substring(2)

  // make transaction
  const tx = new caver.transaction.legacyTransaction({
    from: keyring.toAccount()._address,
    to: address,
    input: functionSelector.concat(params),
    gas: 1500000,
  })

  // send transaction
  let transactionHash = ''
  let err: Error | undefined
  await caver.wallet.sign(keyring.address, tx).then(async (t: LegacyTransaction) => {
    await caver.rpc.klay
      .sendRawTransaction(t)
      .on('transactionHash', (hash: string) => {
        transactionHash = hash
      })
      .on('receipt')
      .on('error', (error: Error) => {
        err = error
      })
  })
  return callback(transactionHash, err)
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

  return sendFulfillment(
    address,
    data,
    topcis,
    JSON.parse(value).result,
    (txHash: string, err?: Error): Promise<AdapterResponse> => {
      if (err) {
        return Requester.errored(
          jobRunID,
          new AdapterError({
            jobRunID,
            message: err,
            statusCode: 400,
          }),
        )
      }

      return Requester.success(jobRunID, {
        data: { result: txHash },
        result_tx: txHash,
        status: 200,
      })
    },
  )
}

export const makeExecute: ExecuteFactory<Config> = (config) => {
  return async (request) => execute(request, config || makeConfig())
}
