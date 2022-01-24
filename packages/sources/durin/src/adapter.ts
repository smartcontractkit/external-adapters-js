import { ExecuteWithConfig, ExecuteFactory, InputParameters } from '@chainlink/types'
import { Config, makeConfig } from './config'
import * as endpoints from './endpoint'
import { ethers } from 'ethers'
import { Validator } from '@chainlink/ea-bootstrap'
import { Interface } from '@ethersproject/abi'
import { HandlerResponse } from './types'
import { concat, hexlify } from '@ethersproject/bytes'

export const inputParameters: InputParameters = {
  data: true,
}

export const execute: ExecuteWithConfig<Config> = async (request, context, config) => {
  const validator = new Validator(request, inputParameters)

  const response = await endpoints.optimismGateway.execute(request, context, config)
  const handlerResponse = response.data.result as HandlerResponse

  const sigHash = Interface.getSighash(handlerResponse.returnType)
  const abiEncoded = ethers.utils.defaultAbiCoder.encode(
    handlerResponse.returnType.inputs,
    handlerResponse.response,
  )

  const result = hexlify(concat([sigHash, abiEncoded]))
  const jobRunID = validator.validated.jobRunID

  return {
    jobRunID,
    result,
    statusCode: 200,
    data: {
      result,
    },
  }
}

export const makeExecute: ExecuteFactory<Config> = (config) => {
  return async (request, context) => execute(request, context, config || makeConfig())
}
