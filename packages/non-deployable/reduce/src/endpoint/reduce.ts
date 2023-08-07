import {
  NestableValue,
  objectPath,
  Requester,
  Validator,
  AdapterInputError,
} from '@chainlink/ea-bootstrap'
import { util } from '@chainlink/ea-bootstrap'
import { Execute, InputParameters } from '@chainlink/ea-bootstrap'
import { Decimal } from 'decimal.js'

export const supportedEndpoints = ['reduce']

export type TInputParameters = {
  reducer: string
  initialValue: number | string
  dataPath: string
  valuePath: string
  addresses: NestableValue
}
export const inputParameters: InputParameters<TInputParameters> = {
  reducer: {
    required: true,
    description:
      'The reducer this adapter will use on the input. Options are: sum, product, min, max, average, median',
  },
  initialValue: {
    required: false,
    description:
      'is not provided reasonable defaults are going to be used, depending on the `reducer`.',
  },
  dataPath: {
    required: false,
    description: ' Optional path where to find the input array to reduce',
    default: 'result',
  },
  valuePath: {
    required: false,
    description: 'Optional path where to find the property to be accumulated by the reducer',
  },
  addresses: {
    required: false,
  },
}

const MAX_DECIMALS = 18
const DEFAULT_DATA_PATH = 'result'

// Export function to integrate with Chainlink node
export const execute: Execute = async (request) => {
  const validator = new Validator(request, inputParameters)

  const jobRunID = validator.validated.id

  const { data } = validator.validated

  const dataPath = data.dataPath || DEFAULT_DATA_PATH
  let inputData = <Record<string, unknown>[]>objectPath.get(request.data, dataPath)

  // Check if input data is valid
  if (!inputData || !Array.isArray(inputData) || inputData.length === 0) {
    throw new AdapterInputError({
      jobRunID,
      statusCode: 400,
      message: `Input must be a non-empty array.`,
    })
  }

  const path = data.valuePath || ''
  // Check if every input object has a path specified
  if (path && !inputData.every((val) => objectPath.has(val, path))) {
    throw new AdapterInputError({
      jobRunID,
      statusCode: 400,
      message: `Path '${path}' not present in every item.`,
    })
  }

  // Get value at specified path
  const _get = (val: Record<string, unknown>): number => objectPath.get(val, path)

  // Filter undesired values
  inputData = inputData.filter((val) => !!_get(val))

  // Check if all items are numbers
  const _isNumber = (val: Record<string, unknown>): boolean => !isNaN(_get(val))
  if (!inputData.every(_isNumber)) {
    throw new AdapterInputError({
      jobRunID,
      statusCode: 400,
      message: `Not every '${path}' item is a number.`,
    })
  }

  let result: Decimal
  switch (data.reducer) {
    case 'sum': {
      result = inputData.reduce((acc, val) => {
        return acc.plus(new Decimal(_get(val)))
      }, new Decimal(data.initialValue || 0))
      break
    }
    case 'product': {
      result = inputData.reduce(
        (acc, val) => acc.mul(new Decimal(_get(val))),
        new Decimal(data.initialValue || 1),
      )
      break
    }
    case 'average': {
      result = inputData.reduce(
        (acc, val, _, { length }) => acc.plus(new Decimal(_get(val)).div(new Decimal(length))),
        new Decimal(data.initialValue || 0),
      )
      break
    }
    case 'median': {
      const sortedData: Record<string, unknown>[] = inputData.sort((a, b) => _get(a) - _get(b))
      const mid = Math.ceil(inputData.length / 2)
      result =
        inputData.length % 2 === 0
          ? new Decimal(_get(sortedData[mid]))
              .plus(new Decimal(_get(sortedData[mid - 1])))
              .div(new Decimal(2))
          : new Decimal(_get(sortedData[mid - 1]))
      break
    }
    case 'min': {
      result = inputData.reduce(
        (acc, val) => Decimal.min(acc, new Decimal(_get(val))),
        new Decimal(data.initialValue || Number.MAX_VALUE),
      )
      break
    }
    case 'max': {
      result = inputData.reduce(
        (acc, val) => Decimal.max(acc, new Decimal(_get(val))),
        new Decimal(data.initialValue || Number.MIN_VALUE),
      )
      break
    }
    default: {
      throw new AdapterInputError({
        jobRunID,
        statusCode: 400,
        message: `Reducer ${data.reducer} not supported.`,
      })
    }
  }

  // Avoid printing scientific notation on output with `result.toString()`
  const resultStr = util.toFixedMax(result, MAX_DECIMALS)

  return Requester.success(jobRunID, {
    data: { result: resultStr },
    status: 200,
  })
}
