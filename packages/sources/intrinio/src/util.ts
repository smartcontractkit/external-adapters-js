/**
 * This code is directly copied from Intrinio's library.  We have a ticket to refactor this file.
 */

import * as https from 'https'
import * as events from 'events'
import { Logger } from '@chainlink/ea-bootstrap'

const EventEmitter = events.EventEmitter

const SELF_HEAL_BACKOFFS = [0, 100, 500, 1000, 2000]

export class IntrinioRealtime extends EventEmitter {
  options: any
  token: null | string = null
  websocket = null
  ready = false
  channels = {}
  joinedChannels = {}
  afterConnected = null // Promise
  self_heal_backoff = Array.from(SELF_HEAL_BACKOFFS)
  self_heal_ref = null
  quote_callback = null
  error_callback = null

  constructor(options: any) {
    super()

    this.options = options
    this.token = null
    this.websocket = null
    this.ready = false
    this.channels = {}
    this.joinedChannels = {}
    this.afterConnected = null // Promise
    this.self_heal_backoff = Array.from(SELF_HEAL_BACKOFFS)
    this.self_heal_ref = null
    this.quote_callback = null
    this.error_callback = null

    // Parse options
    if (!options) {
      this._throw('Need a valid options parameter')
    }

    if (options.api_key) {
      if (!this._validAPIKey(options.api_key)) {
        this._throw('API Key was formatted invalidly')
      }
    } else {
      if (!options.username && !options.password) {
        this._throw('API key or username and password are required')
      }

      if (!options.username) {
        this._throw('Need a valid username')
      }

      if (!options.password) {
        this._throw('Need a valid password')
      }
    }

    const providers = ['iex', 'quodd', 'cryptoquote', 'fxcm']
    if (!options.provider || !providers.includes(options.provider)) {
      this._throw('Need a valid provider: iex, quodd, cryptoquote, or fxcm')
    }
  }

  _throw(e: any) {
    let handled = false
    if (typeof e === 'string') {
      e = 'IntrinioRealtime | ' + e
    }
    if (this.listenerCount('error') > 0) {
      Logger.error(e)
      handled = true
    }
    if (!handled) {
      throw e
    }
  }

  _makeAuthUrl(): { host: string; path: string } {
    let auth_url = {
      host: '',
      path: '',
    }

    if (this.options.provider == 'iex') {
      auth_url = {
        host: 'realtime.intrinio.com',
        path: '/auth',
      }
    } else if (this.options.provider == 'quodd') {
      auth_url = {
        host: 'api.intrinio.com',
        path: '/token?type=QUODD',
      }
    } else if (this.options.provider == 'cryptoquote') {
      auth_url = {
        host: 'crypto.intrinio.com',
        path: '/auth',
      }
    } else if (this.options.provider == 'fxcm') {
      auth_url = {
        host: 'fxcm.intrinio.com',
        path: '/auth',
      }
    }

    if (this.options.api_key) {
      auth_url = this._makeAPIAuthUrl(auth_url)
    }

    return auth_url
  }

  _makeAPIAuthUrl(auth_url: any): any {
    let path = auth_url.path

    if (path.includes('?')) {
      path = path + '&'
    } else {
      path = path + '?'
    }

    auth_url.path = path + 'api_key=' + this.options.api_key
    return auth_url
  }

  _makeHeaders() {
    if (this.options.api_key) {
      return {
        'Content-Type': 'application/json',
      }
    } else {
      const { username, password } = this.options

      return {
        'Content-Type': 'application/json',
        Authorization: 'Basic ' + Buffer.from(username + ':' + password).toString('base64'),
      }
    }
  }

  _refreshToken() {
    Logger.debug('Requesting auth token...')

    return new Promise<void>((fulfill, reject) => {
      const agent = this.options.agent || false
      const { host, path } = this._makeAuthUrl()
      const headers = this._makeHeaders()

      // Get token
      const options = {
        host: host,
        path: path,
        agent: agent,
        headers: headers,
      }

      const req = https.get(options, (res: any) => {
        if (res.statusCode == 401) {
          this._throw('Unable to authorize')
          reject()
        } else if (res.statusCode != 200) {
          console.error(
            'IntrinioRealtime | Could not get auth token: Status code ' + res.statusCode,
          )
          reject()
        } else {
          res.on('data', (data: any) => {
            this.token = Buffer.from(data, 'base64').toString()
            Logger.debug('Received auth token!')
            fulfill()
          })
        }
      })

      req.on('error', (e) => {
        console.error('IntrinioRealtime | Could not get auth token: ' + e)
        reject(e)
      })

      req.end()
    })
  }

  async _makeSocketUrl(): Promise<string> {
    if (!this.token) {
      await this._refreshToken()
      if (!this.token) return ''
    }

    if (this.options.provider == 'iex') {
      return (
        'wss://realtime.intrinio.com/socket/websocket?vsn=1.0.0&token=' +
        encodeURIComponent(this.token)
      )
    } else if (this.options.provider == 'quodd') {
      return 'wss://www5.quodd.com/websocket/webStreamer/intrinio/' + encodeURIComponent(this.token)
    } else if (this.options.provider == 'cryptoquote') {
      return (
        'wss://crypto.intrinio.com/socket/websocket?vsn=1.0.0&token=' +
        encodeURIComponent(this.token)
      )
    } else if (this.options.provider == 'fxcm') {
      return (
        'wss://fxcm.intrinio.com/socket/websocket?vsn=1.0.0&token=' + encodeURIComponent(this.token)
      )
    }

    return ''
  }

  _makeHeartbeatMessage(): any {
    if (this.options.provider == 'quodd') {
      return { event: 'heartbeat', data: { action: 'heartbeat', ticker: Date.now() } }
    } else if (['iex', 'cryptoquote', 'fxcm'].includes(this.options.provider)) {
      return { topic: 'phoenix', event: 'heartbeat', payload: {}, ref: null }
    }
  }

  _makeJoinMessage(channel: string): any {
    if (this.options.provider == 'iex') {
      return {
        topic: this._parseIexTopic(channel),
        event: 'phx_join',
        payload: {},
        ref: null,
      }
    } else if (this.options.provider == 'quodd') {
      return {
        event: 'subscribe',
        data: {
          ticker: channel,
          action: 'subscribe',
        },
      }
    } else if (['cryptoquote', 'fxcm'].includes(this.options.provider)) {
      return {
        topic: channel,
        event: 'phx_join',
        payload: {},
        ref: null,
      }
    }
  }

  _makeLeaveMessage(channel: string): any {
    if (this.options.provider == 'iex') {
      return {
        topic: this._parseIexTopic(channel),
        event: 'phx_leave',
        payload: {},
        ref: null,
      }
    } else if (this.options.provider == 'quodd') {
      return {
        event: 'unsubscribe',
        data: {
          ticker: channel,
          action: 'unsubscribe',
        },
      }
    } else if (['cryptoquote', 'fxcm'].includes(this.options.provider)) {
      return {
        topic: channel,
        event: 'phx_leave',
        payload: {},
        ref: null,
      }
    }
  }

  _parseIexTopic(channel: string): string {
    let topic = null
    if (channel == '$lobby') {
      topic = 'iex:lobby'
    } else if (channel == '$lobby_last_price') {
      topic = 'iex:lobby:last_price'
    } else {
      topic = 'iex:securities:' + channel
    }
    return topic
  }

  _validAPIKey(api_key: string): boolean {
    if (typeof api_key !== 'string') {
      return false
    }

    if (api_key === '') {
      return false
    }

    return true
  }
}
