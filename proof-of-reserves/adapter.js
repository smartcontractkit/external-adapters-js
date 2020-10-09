const { Requester } = require('@chainlink/external-adapter')
const addressesAdapter = require('./addressSet/adapter').execute
const explorerAdapter = require('./explorer/adapter').execute
const reduceAdapter = require('./reduce/adapter').execute

const execute = (input, callback) => {
  const jobRunID = input.id
  const requestInput = input.data

  const _handleError = (error) => {
    callback(500, Requester.errored(jobRunID, error))
  }

  const makeRequestData = (input) => {
    return { id: jobRunID, data: { ...requestInput, ...input.data } }
  }

  const _onAddresses = (statusCode, data) => {
    if (statusCode < 200 || statusCode >= 400) {
      return _handleError(data.error)
    }
    explorerAdapter(makeRequestData(data), _onExplorer)
  }

  const _onExplorer = (statusCode, data) => {
    if (statusCode < 200 || statusCode >= 400) {
      return _handleError(data.error)
    }
    reduceAdapter(makeRequestData(data), callback)
  }

  addressesAdapter(input, _onAddresses)
}

exports.execute = execute
