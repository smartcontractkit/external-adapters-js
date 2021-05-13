import { Requester, Validator } from '@chainlink/ea-bootstrap'
import { AdapterRequest, AdapterResponse } from '@chainlink/types'
import { Conflux } from 'js-conflux-sdk'
import { ethers } from 'ethers'
import { Config } from '../config'

const sendFulfillment = async (
  provider: any,
  account: any,
  to: string,
  dataPrefix: string,
  functionSelector: string,
  value: number,
) => {
  const dataPrefixBz = ethers.utils.arrayify(dataPrefix)
  const functionSelectorBz = ethers.utils.arrayify(functionSelector)
  const valueBz = ethers.utils.zeroPad(ethers.utils.arrayify(Number(value)), 32)
  const data = ethers.utils.concat([functionSelectorBz, dataPrefixBz, valueBz])

  const tx = {
    from: account.address,
    to: to,
    data: ethers.utils.hexlify(data),
    gas: 500000,
    gasPrice: 1,
  }

  return await provider.sendTransaction(tx).executed()
}

// const customError = (data: any) => data.Response === 'Error'

const customParams = {
  // Use two sets of possible keys in case the node operator
  // is using a non-EI initiator where the primary keys are reserved.
  address: ['address', 'cfxAddress'],
  dataPrefix: ['dataPrefix', 'cfxDataPrefix'],
  functionSelector: ['functionSelector', 'cfxFunctionSelector'],
  value: ['result', 'value'],
}

export const NAME = 'conflux'

export const execute = async (
  request: AdapterRequest,
  config: Config,
): Promise<AdapterResponse> => {
  const validator = new Validator(request, customParams)
  if (validator.error) throw validator.error

  const provider = new Conflux({
    url: config.rpcUrl,
    networkId: Number(config.networkId),
    defaultGasRatio: 1.3,
    defaultStorageRatio: 1.3,
  })
  const account = provider.wallet.addPrivateKey(config.privateKey)

  const jobRunID = validator.validated.id
  const address = validator.validated.data.address
  const dataPrefix = validator.validated.data.dataPrefix
  const functionSelector = validator.validated.data.functionSelector
  const value = validator.validated.data.value

  // handling the multiplying
  // if (request.data.times !== undefined) {
  //   value = String(Math.round(Number(value)*Number(request.data.times)))
  // }
  // @ts-ignore
  const { transactionHash: txHash } = await sendFulfillment(
    provider,
    account,
    address,
    dataPrefix,
    functionSelector,
    value,
  )

  return Requester.success(jobRunID, {
    data: { result: txHash },
    status: 200,
  })
}
