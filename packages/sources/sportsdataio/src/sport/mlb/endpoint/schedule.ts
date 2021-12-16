import { Requester, Validator } from '@chainlink/ea-bootstrap'
import { ExecuteWithConfig } from '@chainlink/types'
import { Config } from '../../../config'
import { ethers } from 'ethers'
import { GameResponse } from '../types'
import { getGamesByDate, getGamesByTeam } from '../utils'

export const NAME = 'schedule'

const customParams = {
  date: true,
  teamID: false,
  onlyShowGameIDs: false,
}

export const execute: ExecuteWithConfig<Config> = async (request, _, config) => {
  const validator = new Validator(request, customParams)
  if (validator.error) throw validator.error

  const jobRunID = validator.validated.id
  const { date, teamID, onlyShowGameIDs } = validator.validated.data
  let games = await getGamesByDate(date, config)

  if (teamID) {
    games = getGamesByTeam(games, teamID)
  }

  const result = onlyShowGameIDs ? games.map((game) => game.GameID) : encodeGames(games)
  const respData = {
    data: {
      games,
      result,
    },
    result,
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
