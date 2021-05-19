import { Requester, Validator } from '@chainlink/ea-bootstrap'
import { ExecuteWithConfig } from '@chainlink/types'
import { Config } from '../config'
import { bytesMappingToHexStr, ABI, sportDataProviderMapping } from './index'
import { ethers } from 'ethers'
import { Logger } from '@chainlink/ea-bootstrap'
import { theRundown, sportsdataio } from '../dataProviders'

const createParams = {
  sport: true,
  contractAddress: true,
}

const TBD_TEAM_ID = 2756;

export const execute: ExecuteWithConfig<Config> = async (input, config) => {
  const validator = new Validator(input, createParams)
  if (validator.error) throw validator.error

  const sport = validator.validated.data.sport
  const contractAddress = validator.validated.data.contractAddress
  const contract = new ethers.Contract(contractAddress, ABI, config.wallet)
  input.data.contract = contract

  let packed: string[] = []
  if (sportDataProviderMapping['theRundown'].includes(sport.toUpperCase())) {
    packed = (await theRundown.create(input)).result
  } else if (sportDataProviderMapping['sportsdataio'].includes(sport.toUpperCase())) {
    packed = (await sportsdataio.create(input)).result
  } else {
    throw Error(`Unknown data provider for sport ${sport}`)
  }

  Logger.debug(`Augur: Prepared to create ${packed.length} events`)

  let failed = 0
  let succeeded = 0

  let nonce = await config.wallet.getTransactionCount()
  for (let i = 0; i < packed.length; i++) {
    try {
      const tx = await contract.createMarket(packed[i], { nonce })
      Logger.debug(`Created tx: ${tx.hash}`)
      nonce++
      succeeded++
    } catch (e) {
      failed++
      Logger.error(e)
    }
  }

  Logger.debug(`Augur: ${succeeded} created markets`)
  Logger.debug(`Augur: ${failed} markets failed to create`)

  return Requester.success(input.id, {})
}

export const packCreation = (
  eventId: ethers.BigNumber,
  homeTeamId: number,
  awayTeamId: number,
  startTime: number,
  homeSpread: number,
  totalScore: number,
  createSpread: boolean,
  createTotalScore: boolean,
): string => {
  const encoded = ethers.utils.defaultAbiCoder.encode(
    ['uint128', 'uint16', 'uint16', 'uint32', 'int16', 'uint16', 'uint8'],
    [
      eventId,
      homeTeamId,
      awayTeamId,
      Math.floor(startTime / 1000),
      Math.round(homeSpread*10),
      Math.round(totalScore*10),
      packCreationFlags(createSpread, createTotalScore)
    ]
  )

  const mapping = [16, 2, 2, 4, 2, 2, 1]
  return bytesMappingToHexStr(mapping, encoded)
}

const packCreationFlags = (createSpread: boolean, createTotalScore: boolean): number => {
  let flags = 0b00000000;
  if (createSpread) flags += 0b00000001;
  if (createTotalScore) flags += 0b00000010;
  return flags;
}
