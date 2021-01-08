import objectPath from 'object-path'
import { Requester, Validator } from '@chainlink/external-adapter'
import { Execute } from '@chainlink/types'
import BN from 'bn.js'

const inputParams = {
  reducer: true,
  initialValue: false,
  dataPath: false,
  valuePath: false,
}

const DEFAULT_DATA_PATH = 'result'

// Export function to integrate with Chainlink node
export const execute: Execute = async (request) => {
  const validator = new Validator(request, inputParams)
  if (validator.error) throw validator.error

  const jobRunID = validator.validated.id

  const { data } = validator.validated

  const dataPath = data.dataPath || DEFAULT_DATA_PATH
  let inputData = <number[]>objectPath.get(request.data, dataPath)

  // Check if input data is valid
  if (!inputData || !Array.isArray(inputData) || inputData.length === 0) {
    throw Error(`Input must be a non-empty array.`)
  }

  const path = data.valuePath || ''
  // Check if every input object has a path specified
  if (path && !inputData.every((val) => objectPath.has(val, path))) {
    throw Error(`Path '${path}' not present in every item.`)
  }

  // Get value at specified path
  const _get = (val: unknown): number => objectPath.get(val, path)

  // Filter undesired values
  inputData = inputData.filter((val) => !!_get(val))

  // Check if all items are numbers
  const _isNumber = (val: unknown): boolean => !isNaN(_get(val))
  if (!inputData.every(_isNumber)) {
    throw Error(`Not every '${path}' item is a number.`)
  }

  let result: BN
  switch (data.reducer) {
    case 'sum': {
      result = inputData.reduce(
        (acc, val) => acc.add(new BN(_get(val))),
        new BN(data.initialValue) || new BN(0),
      )
      break
    }
    case 'product': {
      result = inputData.reduce(
        (acc, val) => acc.mul(new BN(_get(val))),
        new BN(data.initialValue) || new BN(1),
      )
      break
    }
    case 'average': {
      result = inputData.reduce(
        (acc, val, _, { length }) => acc.add(new BN(_get(val)).div(new BN(length))),
        new BN(data.initialValue) || new BN(0),
      )
      break
    }
    case 'median': {
      const sortedData = inputData.sort((a, b) => _get(a) - _get(b))
      const mid = Math.ceil(inputData.length / 2)
      result =
        inputData.length % 2 === 0
          ? new BN(sortedData[mid]).add(new BN(sortedData[mid - 1])).div(new BN(2))
          : new BN(sortedData[mid - 1])
      break
    }
    case 'min': {
      result = inputData.reduce(
        (acc, val) => BN.min(acc, new BN(_get(val))),
        new BN(data.initialValue) || new BN(Number.MAX_VALUE),
      )
      break
    }
    case 'max': {
      result = inputData.reduce(
        (acc, val) => BN.max(acc, new BN(_get(val))),
        new BN(data.initialValue) || new BN(Number.MIN_VALUE),
      )
      break
    }
    default: {
      throw Error(`Reducer ${data.reducer} not supported.`)
    }
  }

  return Requester.success(jobRunID, {
    data: { result: result.toString() },
    result,
    status: 200,
  })
}
