import { Logger, Requester, Validator } from '@chainlink/ea-bootstrap'
import { ExecuteWithConfig, Execute } from '@chainlink/types'
import { Config } from '../config'
import { CRYPTO_ABI } from './index'
import { ethers } from 'ethers'
import { DateTime } from 'luxon'

const pokeParams = {
  contractAddress: true,
}

export const execute: ExecuteWithConfig<Config> = async (input, config) => {
  const validator = new Validator(input, pokeParams)
  if (validator.error) throw validator.error

  const jobRunID = input.id

  const contractAddress = validator.validated.data.contractAddress
  const contract = new ethers.Contract(contractAddress, CRYPTO_ABI, config.wallet)

  try {
    await createAndResolveMarkets(contract);
  } catch(e) {
    return Requester.errored(jobRunID, e)
  }

  return Requester.success(jobRunID)
}

async function createAndResolveMarkets(contract: ethers.Contract) {
  const nowEastern = DateTime.now().setZone("America/New_York")

  const expectedRunTimeSeconds = await contract.nextResolutionTime()
  if (nowEastern.weekday !== 4) {
    throw Error(`Augur: cryptoMarkets - attempted poke at invalid time ${nowEastern}, must be Thursday`)
  }

  if (nowEastern.hour !== 16) {
    throw Error(`Augur: cryptoMarkets - attempted poke at invalid time - ${nowEastern}, must be during 4 o'clock hour, eastern`)
  }

  const contractNextResolutionTime = await contract.nextResolutionTime()

  if(contractNextResolutionTime > nowEastern.toSeconds()) {
    Logger.log(`Augur: Next resolution time is in the future`)
    return
  }

  const nextWeekEastern = nowEastern.plus({week: 1}).set({minute: 0, second: 0, millisecond: 0})

  await contract.createAndResolveMarkets(nextWeekEastern.toSeconds())
}
