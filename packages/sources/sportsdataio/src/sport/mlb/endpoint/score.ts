import { Requester, Validator } from '@chainlink/ea-bootstrap'
import { ExecuteWithConfig } from '@chainlink/types'
import { Config } from '../../../config'
import { ethers } from 'ethers'
import { GameResponse } from '../types'
import { getGamesByDate } from '../utils'

export const NAME = 'score'

const customParams = {
  gameID: true,
  date: true,
}

export const execute: ExecuteWithConfig<Config> = async (request, _, config) => {
  const validator = new Validator(request, customParams)
  if (validator.error) throw validator.error

  const jobRunID = validator.validated.id
  const date = validator.validated.data.date
  const gameID = validator.validated.data.gameID
  const games = await getGamesByDate(date, config)
  let game = games.find((game) => game.GameID === gameID)
  if (!game) {
    throw new Error(`Cannot find game with ID ${gameID} on date ${date}`)
  }
  game = hideValuesIfGameNotFinished(game)

  const encodedGame = encodeGame(game)
  const respData = {
    data: {
      ...game,
      homeTeamScore: game.HomeTeamRuns,
      awayTeamScore: game.AwayTeamRuns,
      result: encodedGame,
    },
    result: encodedGame,
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

const hideValuesIfGameNotFinished = (game: GameResponse): GameResponse => {
  const isGameComplete = game.Status === 'Final'
  if (isGameComplete) return game
  return {
    ...game,
    AwayTeamMoneyLine: -1,
    HomeTeamMoneyLine: -1,
    AwayTeamRuns: -1,
    HomeTeamRuns: -1,
  }
}
