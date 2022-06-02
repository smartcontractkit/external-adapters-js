import { ExecuteWithConfig, InputParameters } from '@chainlink/ea-bootstrap'
import { Requester, Validator } from '@chainlink/ea-bootstrap'
import { ethers } from 'ethers'
import { Config } from '../config'
import xsushiABI from '../abi/xsushi.json'

export const supportedEndpoints = ['sushi']

export const description = 'Gets the SUSHI token address from the xSUSHI contract.'

export type TInputParameters = Record<string, never>
export const inputParameters: InputParameters<TInputParameters> = {}

export const execute: ExecuteWithConfig<Config> = async (input, _, config) => {
  const validator = new Validator(input, inputParameters)

  const jobRunID = validator.validated.id
  const xsushiAddress = config.xsushiAddress

  const contract = new ethers.Contract(xsushiAddress, xsushiABI, config.provider)
  const sushi = await contract.sushi()

  const response = {
    data: sushi,
  }

  return Requester.success(jobRunID, response, true)
}
