import { AdapterContext, AdapterRequest } from '@chainlink/types'
import { Config, FIXED_POINT_DECIMALS } from '../../config'
import { Validator } from '@chainlink/ea-bootstrap'
import { ethers } from 'ethers'
import { callViewFunctionEA, throwErrorForInvalidResult } from '../../utils'

export const FROM = 'BLUNA'
export const INTERMEDIARY_TOKEN = 'LUNA'

/**
 * execute returns the USD/bLUNA price by performing a conversion between two
 * intermediate prices. The calculation is as follows:
 * result = (USD / LUNA) * (LUNA / bLUNA) = USD / bLUNA
 * @param input AdapterRequest
 * @param context AdapterContext
 * @param config Config
 * @param usdPerLuna ethers.BigNumber
 * @returns Promise<ethers.BigNumber>
 */
export const execute = async (
  input: AdapterRequest,
  context: AdapterContext,
  config: Config,
  usdPerLuna: ethers.BigNumber,
): Promise<ethers.BigNumber> => {
  const validator = new Validator(input)
  if (validator.error) throw validator.error
  const viewFunctionAdapterResponse = await callViewFunctionEA(
    input,
    context,
    config.terraBLunaHubContractAddress,
    {
      state: {},
    },
  )
  const lunaPerBLuna = viewFunctionAdapterResponse.data.result.exchange_rate
  const lunaPerBLunaBigNum = ethers.utils.parseUnits(lunaPerBLuna, FIXED_POINT_DECIMALS)
  throwErrorForInvalidResult(
    input.id,
    lunaPerBLunaBigNum,
    `LUNA/bLUNA rate from bLUNA address ${config.terraBLunaHubContractAddress}`,
  )
  return lunaPerBLunaBigNum.mul(usdPerLuna).div(ethers.BigNumber.from(10).pow(FIXED_POINT_DECIMALS))
}
