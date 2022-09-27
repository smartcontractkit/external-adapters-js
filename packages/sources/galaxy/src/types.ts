export interface TickerMessage {
  type: string
  signal: string
  ts: number
  value: number
}

export interface AccessTokenResponse {
  token?: string
  message?: string
}

export interface AccessToken {
  token: string
  created: number
}

export interface Pair {
  type: string
  signals: string[]
}
