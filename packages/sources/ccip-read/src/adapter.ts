import {
  ExecuteWithConfig,
  ExecuteFactory,
  InputParameters,
  Requester,
} from '@chainlink/ea-bootstrap'
import { Config, makeConfig } from './config'
import * as endpoints from './endpoint'
import { ethers } from 'ethers'
import { Validator } from '@chainlink/ea-bootstrap'
import { Interface } from '@ethersproject/abi'
import { HandlerResponse } from './types'
import { concat, hexlify } from '@ethersproject/bytes'

export type TInputParameters = { data: string }
const inputParameters: InputParameters<TInputParameters> = {
  data: true,
}

export const execute: ExecuteWithConfig<Config> = async (request, context, config) => {
  const validator = new Validator(request, inputParameters)

  const response = await endpoints.optimismGateway.execute(request, context, config)
  const handlerResponse = response.data.result as unknown as HandlerResponse

  const sigHash = Interface.getSighash(handlerResponse.returnType)
  const abiEncoded = ethers.utils.defaultAbiCoder.encode(
    handlerResponse.returnType.inputs,
    handlerResponse.response,
  )

  const result = hexlify(concat([sigHash, abiEncoded]))
  const jobRunID = validator.validated.id

  const res = {
    jobRunID,
    result,
    statusCode: 200,
    data: {
      result,
    },
  }
  return Requester.success(jobRunID, res, config.verbose)
}

export const makeExecute: ExecuteFactory<Config> = (config) => {
  return async (request, context) => execute(request, context, config || makeConfig())
}
