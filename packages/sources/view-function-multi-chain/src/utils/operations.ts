import { AdapterInputError } from '@chainlink/external-adapter-framework/validation/error'
import { ethers } from 'ethers'
import { OperationParam, OperationType, RequestParams } from '../endpoint/calculated-multi-function'

export const validateOperations = (params: RequestParams) => {
  const definedNames = new Set<string>()
  params.functionCalls.forEach((fn) => definedNames.add(fn.name))
  params.constants.forEach((constant) => definedNames.add(constant.name))
  params.operations.forEach((operation) => {
    validateOperation(operation, definedNames, params)
    definedNames.add(operation.name)
  })
}

const validateOperation = (
  operation: OperationParam,
  definedNames: Set<string>,
  params: RequestParams,
) => {
  const { type: operationType } = operation
  switch (operationType) {
    case 'select':
      return validateSelect(operation, params)
    case 'multiply':
      return validateMultiply(operation, definedNames)
    case 'divide':
      return validateDivide(operation, definedNames)
    case 'add':
      return validateAdd(operation, definedNames)
    case 'subtract':
      return validateSubtract(operation, definedNames)
    case 'average':
      return validateAverage(operation, definedNames)
  }
  // Verify switch is exhaustive
  operationType satisfies never
}

export const evaluateOperation = (
  operationType: OperationType,
  args: string[],
  data: Record<string, string>,
  params: RequestParams,
): string => {
  switch (operationType) {
    case 'select':
      return evaluateSelect(args, data, params)
    case 'multiply':
      return evaluateMultiply(args, data)
    case 'divide':
      return evaluateDivide(args, data)
    case 'add':
      return evaluateAdd(args, data)
    case 'subtract':
      return evaluateSubtract(args, data)
    case 'average':
      return evaluateAverage(args, data)
  }
  // Verify switch is exhaustive
  operationType satisfies never
}

const validateName = ({
  operationName,
  argName,
  definedNames,
}: {
  operationName: string
  argName: string
  definedNames: Set<string>
}) => {
  if (!definedNames.has(argName)) {
    throw new AdapterInputError({
      statusCode: 400,
      message: `"${argName}" must be defined before "${operationName}"`,
    })
  }
}

const validateNames = ({
  operationName,
  argNames,
  definedNames,
}: {
  operationName: string
  argNames: string[]
  definedNames: Set<string>
}) => {
  argNames.forEach((argName) => validateName({ operationName, argName, definedNames }))
}

const validateSelect = (operation: OperationParam, params: RequestParams): void => {
  const { name, args } = operation
  if (args.length != 2) {
    throw new AdapterInputError({
      statusCode: 400,
      message: `Select operation "${name}" must have 2 arguments`,
    })
  }
  if (!params.functionCalls.some((fc) => fc.name === args[0])) {
    throw new AdapterInputError({
      statusCode: 400,
      message: `Select operation "${name}" references undefined function call "${args[0]}"`,
    })
  }
}

const evaluateSelect = (
  args: string[],
  data: Record<string, string>,
  params: RequestParams,
): string => {
  const functionCall = params.functionCalls.find((fc) => fc.name === args[0])!
  const signature = functionCall.signature
  const iface = new ethers.Interface([signature])
  const fnName = iface.getFunctionName(signature)
  const encodedResult = data[args[0]]
  const decodedResult = iface.decodeFunctionResult(fnName, encodedResult)
  const resultField = args[1]
  return decodedResult[resultField].toString()
}

const validateMultiply = (operation: OperationParam, definedNames: Set<string>): void => {
  const { name, args } = operation
  if (args.length < 2) {
    throw new AdapterInputError({
      statusCode: 400,
      message: `Multiply operation "${name}" must have at least 2 arguments`,
    })
  }
  validateNames({
    operationName: name,
    argNames: args,
    definedNames,
  })
}

const evaluateMultiply = (args: string[], data: Record<string, string>): string => {
  let product = 1n
  for (const arg of args) {
    const value = BigInt(data[arg])
    product *= value
  }
  return product.toString()
}

const validateDivide = (operation: OperationParam, definedNames: Set<string>): void => {
  const { name, args } = operation
  if (args.length != 2) {
    throw new AdapterInputError({
      statusCode: 400,
      message: `Divide operation "${name}" must have 2 arguments`,
    })
  }
  validateNames({
    operationName: name,
    argNames: args,
    definedNames,
  })
}

const evaluateDivide = (args: string[], data: Record<string, string>): string => {
  return (BigInt(data[args[0]]) / BigInt(data[args[1]])).toString()
}

const validateAdd = (operation: OperationParam, definedNames: Set<string>): void => {
  const { name, args } = operation
  if (args.length < 2) {
    throw new AdapterInputError({
      statusCode: 400,
      message: `Add operation "${name}" must have at least 2 arguments`,
    })
  }
  validateNames({
    operationName: name,
    argNames: args,
    definedNames,
  })
}

const evaluateAdd = (args: string[], data: Record<string, string>): string => {
  let sum = 0n
  for (const arg of args) {
    const value = BigInt(data[arg])
    sum += value
  }
  return sum.toString()
}

const validateSubtract = (operation: OperationParam, definedNames: Set<string>): void => {
  const { name, args } = operation
  if (args.length != 2) {
    throw new AdapterInputError({
      statusCode: 400,
      message: `Subtract operation "${name}" must have 2 arguments`,
    })
  }
  validateNames({
    operationName: name,
    argNames: args,
    definedNames,
  })
}

const evaluateSubtract = (args: string[], data: Record<string, string>): string => {
  return (BigInt(data[args[0]]) - BigInt(data[args[1]])).toString()
}

const validateAverage = (operation: OperationParam, definedNames: Set<string>): void => {
  const { name, args } = operation
  if (args.length < 2) {
    throw new AdapterInputError({
      statusCode: 400,
      message: `Average operation "${name}" must have at least 2 arguments`,
    })
  }
  validateNames({
    operationName: name,
    argNames: args,
    definedNames,
  })
}

const evaluateAverage = (args: string[], data: Record<string, string>): string => {
  let sum = 0n
  for (const arg of args) {
    const value = BigInt(data[arg])
    sum += value
  }
  return (sum / BigInt(args.length)).toString()
}
