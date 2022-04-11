import { Requester, util } from '@chainlink/ea-bootstrap'
import { Config } from '../../config'
import { GameResponse } from './types'

export const getGamesByDate = async (date: string, config: Config): Promise<GameResponse[]> => {
  const url = util.buildUrlPath('/mlb/scores/json/GamesByDate/:date', { date })
  const params = {
    key: config.mlbKey,
  }
  const options = { ...config.api, params, url }
  const response = await Requester.request<GameResponse[]>(options)
  return response.data.map(
    ({
      GameID,
      Status,
      DateTime,
      HomeTeam,
      AwayTeam,
      HomeTeamMoneyLine,
      AwayTeamMoneyLine,
      AwayTeamRuns,
      HomeTeamRuns,
    }) => ({
      GameID,
      Status,
      DateTime,
      HomeTeam,
      AwayTeam,
      HomeTeamMoneyLine,
      AwayTeamMoneyLine,
      HomeTeamRuns,
      AwayTeamRuns,
    }),
  )
}
