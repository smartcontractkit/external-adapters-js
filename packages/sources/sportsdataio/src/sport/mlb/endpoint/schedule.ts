import { InputParameters, Requester, Validator } from '@chainlink/ea-bootstrap'
import { ExecuteWithConfig } from '@chainlink/ea-bootstrap'
import { Config } from '../../../config'
import { ethers } from 'ethers'
import { GameResponse } from '../types'
import { getGamesByDate } from '../utils'

export const NAME = 'schedule'

export type TInputParameters = { date: string }
export const customParams: InputParameters<TInputParameters> = {
  date: {
    required: true,
    type: 'string',
    description: 'The date games to query were/are played on',
  },
}

export const execute: ExecuteWithConfig<Config> = async (request, _, config) => {
  const validator = new Validator(request, customParams)

  const jobRunID = validator.validated.id
  const date = validator.validated.data.date

  const games = await getGamesByDate(date, config)
  const encodedGames = encodeGames(games)
  const respData = {
    data: {
      games,
      result: encodedGames,
    },
    result: encodedGames,
    status: 200,
  }
  return Requester.success(jobRunID, respData, config.verbose)
}

const encodeGames = (games: GameResponse[]): string[] => {
  const encodedGames: string[] = []
  const types = ['uint256', 'string', 'string', 'string', 'string']
  for (const game of games) {
    const values = [game.GameID, game.Status, game.DateTime, game.AwayTeam, game.HomeTeam]
    const encodedGame = ethers.utils.defaultAbiCoder.encode(types, values)
    encodedGames.push(encodedGame)
  }
  return encodedGames
}
