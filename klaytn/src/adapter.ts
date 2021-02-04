import { Requester, Validator, AdapterError } from '@chainlink/external-adapter'
import { Config, ExecuteWithConfig, ExecuteFactory } from '@chainlink/types'
import { makeConfig } from './config'
import { txResult } from './types'
import Web3 from 'web3'

const Caver = require('caver-js')
const caver = new Caver(process.env.URL)

const privateKey = process.env.PRIVATE_KEY
const keyring = caver.wallet.keyring.createFromPrivateKey(privateKey)
caver.wallet.add(keyring)

const sendFulfillment = async (address: string, dataPrefix: string, functionSelector: string, value: string) => {
  const dataPrefixBz = Web3.utils.hexToBytes(dataPrefix)
  const functionSelectorBz = Web3.utils.hexToBytes(functionSelector)
  const valueBz = Web3.utils.hexToBytes(value)
  const data = functionSelectorBz.concat(dataPrefixBz, valueBz)

  let tx = new caver.transaction.legacyTransaction({
    from: keyring.toAccount()._address,
    to: address,
    input: Web3.utils.bytesToHex(data),
    gas: 1500000,
  })

  return await caver.wallet.sign(keyring.address, tx)
    .then(caver.rpc.klay.sendRawTransaction)
}

const customParams = {
  address: ['address'],
  dataPrefix: ['dataPrefix'],
  functionSelector: ['functionSelector'],
  value: ['result', 'value']
}

export const execute: ExecuteWithConfig<Config> = async (request, config) => {
  const validator = new Validator(request, customParams)
  if (validator.error) throw validator.error

  Requester.logConfig(config)

  const jobRunID = validator.validated.id
  const address = validator.validated.data.address
  const dataPrefix = validator.validated.data.dataPrefix
  const functionSelector = validator.validated.data.functionSelector
  const value = validator.validated.data.value

  const tx: txResult = await sendFulfillment(
    address,
    dataPrefix,
    functionSelector,
    value,
  )

  return Requester.success(jobRunID, {
    data: { result: tx.transactionHash, },
    result_tx: tx.transactionHash,
    status: 200,
  })
}

export const makeExecute: ExecuteFactory<Config> = (config) => {
  return async (request) => execute(request, config || makeConfig())
}
