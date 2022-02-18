import { ExecuteWithConfig } from '@chainlink/types'
import { Requester, Validator } from '@chainlink/ea-bootstrap'
import { BigNumber, ethers } from 'ethers'
import { Config } from '../config'
import vaultABI from '../abi/vault.json'

export const supportedEndpoints = ['fees']

export const description = 'Gets the fees for specified NFTX vault.'

export const execute: ExecuteWithConfig<Config> = async (input, _, config) => {
  const validator = new Validator(input, {})

  const jobRunID = validator.validated.jobRunID
  const vaultAddress = config.vaultAddress

  const vault = new ethers.Contract(vaultAddress, vaultABI, config.provider)

  const pow = BigNumber.from(10).pow(18)
  const feesBig: BigNumber[] = await vault.vaultFees()
  const fees = feesBig.map((fee) => fee.div(pow))

  const response = {
    data: fees,
  }

  return Requester.success(jobRunID, response, config.verbose)
}
