import { Requester, Validator } from '@chainlink/ea-bootstrap'
import { AdapterRequest, AdapterResponse, Execute } from '@chainlink/types'
import { prices } from "./methods"
import { PRICE, makeConfig, Config } from "./config"
import { ethers } from "ethers"

const customParams = {
  method: false
}

export const execute = async (input: AdapterRequest, config: Config): Promise<AdapterResponse> => {
  const validator = new Validator(input, customParams)
  if (validator.error) throw validator.error
  const jobRunID = validator.validated.jobRunID
  const method = validator.validated.data.method
  const provider = new ethers.providers.JsonRpcProvider(config.infuraHost)
  let response
  switch (method) {
    case PRICE:
    default:
      response = await prices.execute(input, config, provider)
  }
  return Requester.success(jobRunID, response)
}

export const makeExecute = (): Execute => {
  return async (request: AdapterRequest) => execute(request, makeConfig())
}

