import { Requester, Validator } from '@chainlink/external-adapter'
import { util } from '@chainlink/ea-bootstrap'
import { ExecuteWithConfig, Config } from '@chainlink/types'
import { Conflux } from 'js-conflux-sdk'
import { ethers } from 'ethers'

const provider = new Conflux({
  url: util.getRequiredEnv('RPC_URL'),
  networkId: Number(util.getRequiredEnv('NETWORK_ID')),
  defaultGasRatio: 1.3,
  defaultStorageRatio: 1.3,
})
const account = provider.wallet.addPrivateKey(util.getRequiredEnv('PRIVATE_KEY'))

const sendFulfillment = async (
  address: string,
  dataPrefix: string,
  functionSelector: string,
  value: number,
) => {
  const dataPrefixBz = ethers.utils.arrayify(dataPrefix)
  const functionSelectorBz = ethers.utils.arrayify(functionSelector)
  const valueBz = ethers.utils.zeroPad(ethers.utils.arrayify(Number(value)), 32)
  const data = ethers.utils.concat([functionSelectorBz, dataPrefixBz, valueBz])

  const tx = {
    from: account,
    to: address,
    data: ethers.utils.hexlify(data),
    gas: 500000,
    gasPrice: 1,
  }

  return await provider.sendTransaction(tx)
}

export const NAME = 'conflux'

// const customError = (data: any) => data.Response === 'Error'

const customParams = {
  // Use two sets of possible keys in case the node operator
  // is using a non-EI initiator where the primary keys are reserved.
  address: ['address', 'cfxAddress'],
  dataPrefix: ['dataPrefix', 'cfxDataPrefix'],
  functionSelector: ['functionSelector', 'cfxFunctionSelector'],
  value: ['result', 'value'],
}

export const execute: ExecuteWithConfig<Config> = async (request, config) => {
  const validator = new Validator(request, customParams)
  if (validator.error) throw validator.error

  const jobRunID = validator.validated.id
  const address = validator.validated.data.address
  const dataPrefix = validator.validated.data.dataPrefix
  const functionSelector = validator.validated.data.functionSelector
  const value = validator.validated.data.value

  // handling the multiplying
  // if (request.data.times !== undefined) {
  // value = String(Math.round(Number(value)*Number(request.data.times)))
  // }

  const txHash = await sendFulfillment(address, dataPrefix, functionSelector, value)

  return Requester.success(jobRunID, {
    data: { result: txHash },
    result: txHash,
    status: 200,
  })
}
