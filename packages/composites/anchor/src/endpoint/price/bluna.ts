import { AdapterContext, AdapterRequest, AdapterResponse, InputParameters } from '@chainlink/types'
import { Config } from '../../config'
import * as view from '@chainlink/terra-view-function-adapter'
import { Validator } from '@chainlink/ea-bootstrap'

export const FROM = 'BLUNA'
export const INTERMEDIARY_TOKEN_DECIMALS = 8
export const INTERMEDIARY_TOKEN = 'LUNA'

export const inputParameters: InputParameters = {
  terraBLunaContractAddress: true,
}

export const execute = async (
  input: AdapterRequest,
  context: AdapterContext,
  _: Config,
  taAdapterResponse: AdapterResponse,
): Promise<AdapterResponse> => {
  const validator = new Validator(input, inputParameters)
  if (validator.error) throw validator.error
  const _config = view.makeConfig()
  const _execute = view.makeExecute(_config)
  const viewFunctionAdapterRequest: AdapterRequest = {
    id: input.id,
    data: {
      address: validator.validated.data.terraBLunaContractAddress,
      query: {
        state: {},
      },
    },
  }
  const viewFunctionAdapterResponse = await _execute(viewFunctionAdapterRequest, context)
  const lunaPerBLuna = viewFunctionAdapterResponse.data.result.exchange_rate
  const usdPerLuna = taAdapterResponse.data.result
  const result = lunaPerBLuna * usdPerLuna
  return {
    jobRunID: input.id,
    statusCode: 200,
    result,
    data: {
      result,
    },
  }
}
