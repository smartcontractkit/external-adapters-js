const { Requester, Validator } = require('external-adapter')
const ethers = require('ethers')
const rpcUrl = process.env.RPC_URL

const tradingHalted = (exchange, callback) => {
  if (exchange.length === 0) {
    return callback(false)
  }

  Requester.requestRetry({
    url: 'https://www.tradinghours.com/api/v2/status',
    qs: {
      market: exchange,
      api_token: process.env.TH_API_KEY
    }
  })
    .then(response => {
      callback(Requester.getResult(response.body, [exchange, 'status']).toLowerCase() !== 'open')
    })
    .catch(() => {
      callback(false)
    })
}

const getContractPrice = async (contractAddress) => {
  const provider = new ethers.providers.JsonRpcProvider(rpcUrl)
  const ABI = [
    'function latestAnswer() external view returns (int256)'
  ]
  const contract = new ethers.Contract(contractAddress, ABI, provider)
  return await contract.latestAnswer()
}

const commonMICs = {
  FTSE: 'xlon',
  N225: 'xjpx'
}

const customParams = {
  base: ['base', 'asset', 'from'],
  contract: ['referenceContract'],
  multiply: false
}

const marketStatusRequest = (input, adapter, callback) => {
  const validator = new Validator(input, customParams, callback)
  const jobRunID = validator.validated.id
  const contract = validator.validated.data.contract
  const multiply = validator.validated.data.multiply || 100000000
  const symbol = validator.validated.data.base.toUpperCase()

  tradingHalted(commonMICs[symbol] || '', halted => {
    if (!halted) {
      return adapter(input, callback)
    }

    getContractPrice(contract).then(price => {
      price = price / multiply
      if (price <= 0) {
        return adapter(input, callback)
      }

      const body = {
        result: price
      }
      const statusCode = 200
      callback(statusCode, Requester.success(jobRunID, {
        body,
        statusCode
      }))
    }).catch(err => {
      console.log(err)
      adapter(input, callback)
    })
  })
}

module.exports.marketStatusRequest = marketStatusRequest
