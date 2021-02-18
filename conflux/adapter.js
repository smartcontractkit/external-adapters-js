const { Conflux } = require('js-conflux-sdk')
const { Requester, Validator } = require('@chainlink/external-adapter')
const { util } = require('@chainlink/ea-adapter')
const { ethers: {utils: etherUtils} } = require("ethers");

const provider = new Conflux({
  url: util.getRequiredEnv("RPC_URL"),
  logger: console, //JSON RPC call logging
  networkId: Number(util.getRequiredEnv("NETWORK_ID")),
  defaultGasRatio: 1.3,
  defaultStorageRatio: 1.3
})
const privateKey = util.getRequiredEnv("PRIVATE_KEY")
const account = provider.wallet.addPrivateKey(privateKey)
// console.log("Fulfillment address: ", account.address);

const sendFulfillment = async (
  address,
  dataPrefix,
  functionSelector,
  value
) => {
  const dataPrefixBz = etherUtils.arrayify(dataPrefix)
  const functionSelectorBz = etherUtils.arrayify(functionSelector)
  const valueBz = etherUtils.zeroPad(etherUtils.arrayify(value), 32)
  const data = etherUtils.concat([functionSelectorBz, dataPrefixBz, valueBz])

  const tx = {
    to: address,
    from: account,
    data: etherUtils.hexlify(data),
    gas: 500000,
    gasPrice: 1,
  }

  return await provider.sendTransaction(tx).executed()
}

const customParams = {
  // Use two sets of possible keys in case the node operator
  // is using a non-EI initiator where the primary keys are reserved.
  address: ['address', 'cfxAddress'],
  dataPrefix: ['dataPrefix', 'cfxDataPrefix'],
  functionSelector: ['functionSelector', 'cfxFunctionSelector'],
  value: ['result', 'value']
}

const createRequest = (input, callback) => {
  const validator = new Validator(input, customParams)
  if (validator.error) return callback(validator.error.statusCode, validator.errored)

  let {
    validated: {
        id: jobRunID,
        data: {
            address,
            dataPrefix,
            functionSelector,
            value
        }
    }
  } = validator;

  //handling the multiplying
  if (input.data.times !== undefined) {
    value = String(Math.round(Number(value)*input.data.times))
  }

  const _handleResponse = tx => {
    // console.log(tx);
    const response = {
      data: { result: tx.transactionHash },
      result: tx.transactionHash,
      status: 200
    }
    callback(response.status, Requester.success(jobRunID, response))
  }

  const _handleError = err => {
    callback(500, Requester.errored(jobRunID, err))
  }

  sendFulfillment(address, dataPrefix, functionSelector, value)
    .then(_handleResponse)
    .catch(_handleError)
}

module.exports = { createRequest }
