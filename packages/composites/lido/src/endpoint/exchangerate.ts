import { Validator, Requester } from '@chainlink/ea-bootstrap'
import { AdapterContext, AdapterRequest, AdapterResponse } from '@chainlink/types'
import { makeExecute as makeViewFunction } from '../../../../sources/view-function'
import type { Config } from '../config/index'

import abi from '../abi/WstETH.json'

export const supportedEndpoints = ['exchangerate']

export const execute = async (
  request: AdapterRequest,
  _: AdapterContext,
  config: Config,
): Promise<AdapterResponse> => {
  const validator = new Validator(request)
  const jobRunID = validator.validated.id

  const exchangeRate = await getStEthPerToken(jobRunID, config.wstEthAddress)

  const response = {
    jobRunID,
    status: 200,
    statusText: 'OK',
    headers: {},
    config: {},
    data: exchangeRate,
  }

  return Requester.success(jobRunID, Requester.withResult(response, exchangeRate))
}

const getStEthPerToken = async (id: string, address: string): Promise<number> => {
  const signature = abi.find((fnSig) => fnSig.name === 'stEthPerToken')
  const response = await viewFunction({ id, data: { address, signature } }, {})
  return parseInt(response.result)
}

const viewFunction = makeViewFunction()
