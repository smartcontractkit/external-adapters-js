const { Requester, Validator } = require('@chainlink/external-adapter')
const {
  authenticate,
  convert,
  getAssetId
} = require('../helpers/bravenewcoin/helpers')

const customParams = {
  from: ['base', 'from', 'coin'],
  to: ['quote', 'to', 'market']
}

const createRequest = (input, callback) => {
  const validator = new Validator(callback, input, customParams)
  const jobRunID = validator.validated.id
  const from = validator.validated.data.from
  const to = validator.validated.data.to

  _createRequest({
    from,
    to
  }).then(resp => callback(resp.status, Requester.success(jobRunID, resp)))
    .catch(error => callback(500, Requester.errored(jobRunID, error)))
}

const _createRequest = async (input) => {
  const token = await authenticate()
  const baseAssetId = await getAssetId(input.from)
  const quoteAssetId = input.to.toUpperCase() === 'USD'
    ? 'USD'
    : await getAssetId(input.to)
  return await convert(token, baseAssetId, quoteAssetId)
}

module.exports.createRequest = createRequest
