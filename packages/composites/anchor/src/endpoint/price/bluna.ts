import { AdapterContext, AdapterRequest } from '@chainlink/types'
import { Config, FIXED_POINT_DECIMALS } from '../../config'
import * as view from '@chainlink/terra-view-function-adapter'
import { Validator } from '@chainlink/ea-bootstrap'
import { BigNumber, ethers } from 'ethers'

export const FROM = 'BLUNA'
export const INTERMEDIARY_TOKEN_DECIMALS = 8
export const INTERMEDIARY_TOKEN = 'LUNA'

export const execute = async (
  input: AdapterRequest,
  context: AdapterContext,
  config: Config,
  usdPerLuna: ethers.BigNumber,
): Promise<ethers.BigNumber> => {
  const validator = new Validator(input)
  if (validator.error) throw validator.error
  const _config = view.makeConfig()
  const _execute = view.makeExecute(_config)
  const viewFunctionAdapterRequest: AdapterRequest = {
    id: input.id,
    data: {
      address: config.terraBLunaContractAddress,
      query: {
        state: {},
      },
    },
  }
  const viewFunctionAdapterResponse = await _execute(viewFunctionAdapterRequest, context)
  const lunaPerBLuna = viewFunctionAdapterResponse.data.result.exchange_rate
  const lunaPerBLunaBigNum = ethers.utils.parseUnits(lunaPerBLuna, FIXED_POINT_DECIMALS)
  return lunaPerBLunaBigNum.mul(usdPerLuna).div(BigNumber.from(10).pow(FIXED_POINT_DECIMALS))
}
