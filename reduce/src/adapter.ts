import objectPath from 'object-path'
import { Requester, Validator } from '@chainlink/external-adapter'
import { Execute } from '@chainlink/types'
import { Decimal } from 'decimal.js'

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

  let result: Decimal
  switch (data.reducer) {
    case 'sum': {
      result = inputData.reduce((acc, val) => {
        return acc.plus(new Decimal(_get(val)))
      }, new Decimal(data.initialValue) || new Decimal(0))
      break
    }
    case 'product': {
      result = inputData.reduce(
        (acc, val) => acc.mul(new Decimal(_get(val))),
        new Decimal(data.initialValue) || new Decimal(1),
      )
      break
    }
    case 'average': {
      result = inputData.reduce(
        (acc, val, _, { length }) => acc.plus(new Decimal(_get(val)).div(new Decimal(length))),
        new Decimal(data.initialValue) || new Decimal(0),
      )
      break
    }
    case 'median': {
      const sortedData = inputData.sort((a, b) => _get(a) - _get(b))
      const mid = Math.ceil(inputData.length / 2)
      result =
        inputData.length % 2 === 0
          ? new Decimal(sortedData[mid]).plus(new Decimal(sortedData[mid - 1])).div(new Decimal(2))
          : new Decimal(sortedData[mid - 1])
      break
    }
    case 'min': {
      result = inputData.reduce(
        (acc, val) => Decimal.min(acc, new Decimal(_get(val))),
        new Decimal(data.initialValue) || new Decimal(Number.MAX_VALUE),
      )
      break
    }
    case 'max': {
      result = inputData.reduce(
        (acc, val) => Decimal.max(acc, new Decimal(_get(val))),
        new Decimal(data.initialValue) || new Decimal(Number.MIN_VALUE),
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
