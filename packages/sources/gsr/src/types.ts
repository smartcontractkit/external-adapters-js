export interface TickerMessage {
  type: string
  data: {
    symbol: string
    price: number
    ts: number
  }
}

export interface TokenError {
  success: false
  ts: number
  error: string
}
export interface TokenSuccess {
  success: true
  ts: number
  token: string
  validUntil: string
}

export interface AccessToken {
  token: string
  validUntil: number
}

export type AccessTokenResponse = TokenError | TokenSuccess
