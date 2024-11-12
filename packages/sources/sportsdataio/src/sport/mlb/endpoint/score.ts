import { AdapterError, InputParameters, Requester, Validator } from '@chainlink/ea-bootstrap'
import { ExecuteWithConfig } from '@chainlink/ea-bootstrap'
import { Config } from '../../../config'
import { ethers } from 'ethers'
import { GameResponse } from '../types'
import { getGamesByDate } from '../utils'

export const NAME = 'score'

export type TInputParameters = { gameID: string | number; date: string }
export const customParams: InputParameters<TInputParameters> = {
  gameID: {
    required: true,
    type: 'number',
    description: 'The game ID of the game to get scores for',
  },
  date: {
    required: true,
    type: 'string',
    description: 'The date the game was played on',
  },
}

export const execute: ExecuteWithConfig<Config> = async (request, _, config) => {
  const validator = new Validator(request, customParams)

  const jobRunID = validator.validated.id
  const date = validator.validated.data.date
  const gameID = validator.validated.data.gameID
  const games = await getGamesByDate(date, config)
  const game = games.find((game) => game.GameID === gameID)

  if (!game) {
    throw new AdapterError({
      message: `Cannot find game with ID ${gameID} on date ${date} in DP response. This could be an issue with input params or the DP`,
    })
  }
  const encodedGame = encodeGame(game)
  const respData = {
    data: {
      ...game,
      homeTeamScore: game.HomeTeamRuns,
      awayTeamScore: game.AwayTeamRuns,
      result: encodedGame,
    },
    result: encodedGame,
    status: 200,
  }

  return Requester.success(jobRunID, respData, config.verbose)
}

const encodeGame = (game: GameResponse): string => {
  const types = [
    'uint256',
    'string',
    'string',
    'string',
    'string',
    'int256',
    'int256',
    'int256',
    'int256',
  ]
  const values = [
    game.GameID,
    game.Status,
    game.DateTime,
    game.AwayTeam,
    game.HomeTeam,
    game.AwayTeamMoneyLine,
    game.HomeTeamMoneyLine,
    game.AwayTeamRuns,
    game.HomeTeamRuns,
  ]
  return ethers.utils.defaultAbiCoder.encode(types, values)
}
