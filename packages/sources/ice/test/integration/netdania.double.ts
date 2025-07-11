/* A test double for the server side of the NetDania API
 * This should be used in integration tests to simulate the NetDania API.
 * It is used in XmlHttpRequest mocks but should remain agnostic of particular test libraries.
 * It does not need to implement http level details, just the logic, and the state of the API.
 * It should also not reference jsApi or any other client side library.
 * We should keep static data and functions separate from what is state-dependent.
 * It implements one endpoint. What varies are the query parameters.
 * What query parameters are valid and what they return is state-dependent.
 */

import { config } from '../../src/config'
import * as querystring from 'node:querystring'
import fs from 'fs'

export type QueryParams = {
  v: string | undefined
  dt: string
  h: string | undefined
  sessid: string | undefined
  xcmd: string | undefined
  cb: string | undefined
  xpoll: string | undefined
  xstream: string | undefined
  ts: string | undefined
}

type XCmd = {
  t: number // type, e.g. 1 for price
  i: number // instrumentId, e.g. 1 (from the )
  m: number // boolean, 1 for true
  s: string // instrumentName, e.g. 'EURUSD'
  p: string // provider, e.g. 'idc'
}

export type ReplyResult = {
  status: number
  headers: Record<string, string>
  body: string
}

class InstrumentData {
  private index = 0 // to swing up and down the data
  private goingUp = true

  // an array of arrays, each array is a set of (field, value) data for one instrumentId
  private data: { f: number; v: string }[][]

  // gets the data array from eurusd-sample-data.jsonl file in the current directory
  constructor(public name: string) {
    this.data = fs
      .readFileSync(__dirname + `/${name.toLowerCase()}-sample-data.jsonl`, 'utf-8')
      .split('\n')
      .map((line) => JSON.parse(line) as { f: number; v: string }[])
  }

  // returns a line in the array. Starts at 0, goes up to the length of the array, then wraps around at 1 (avoiding 0)
  public sample(): { f: number; v: string }[] {
    const result = this.data[this.index]

    // set next index
    if (this.goingUp) {
      this.index += 1
      if (this.index >= this.data.length) {
        this.goingUp = false
        this.index = this.data.length - 2 // go back to the second last element
      }
    } else {
      this.index -= 1
      if (this.index <= 0) {
        this.goingUp = true
        this.index = 1 // go back to the second element
      }
    }
    return result
  }
}

/**
 * A test double for the server side of the NetDania API.
 *
 * This is obviously incomplete, but it serves for us to test the client getting price feeds, so
 * that we can test the adapter.
 *
 * Notes:
 * - it doesn't support t: 5 xcmd remove instrument, nor t: 39 close connection.
 * - it doesn't support updating requests, i.e. for the same id to start querying in different ways.
 * - it would be nice to have the prices actually vary, or be read from raw-price-updates.jsonl
 */
export class NetDaniaDouble {
  private static instance: NetDaniaDouble | undefined = undefined
  private expectedPassword!: string
  private sessions: Map<string, [number, string][]> = new Map()
  // instrument data is associated with an instrument name, shared across all sessions
  private instrumentData: Map<string, InstrumentData> = new Map()

  private constructor(cfg: typeof config.settings) {
    this.expectedPassword = cfg.NETDANIA_PASSWORD
  }

  public static getInstance(cfg: typeof config.settings): NetDaniaDouble {
    if (!NetDaniaDouble.instance) {
      NetDaniaDouble.instance = new NetDaniaDouble(cfg)
    }
    return NetDaniaDouble.instance
  }

  public static base64JsonDecode(s: string) {
    return JSON.parse(Buffer.from(s.replace(/\./g, '='), 'base64').toString('utf-8'))
  }

  private static mkSessionId(): string {
    return 'UP' + Math.floor(Math.random() * 1000000).toString()
  }

  private static isValidXCMD(parsed: XCmd[]): boolean {
    let result = false
    try {
      result =
        Array.isArray(parsed) &&
        parsed.length >= 1 &&
        parsed.every((c: XCmd) => c.t === 1 && c.m === 1 && c.s.length === 6 && c.p === 'idc')
    } catch (e) {
      console.debug('invalid XCMD: ', JSON.stringify(parsed), e)
    }
    if (!result) {
      console.debug('invalid XCMD', JSON.stringify(parsed))
    }
    return result
  }

  /** entrypoint */
  public streaming(uri: string): ReplyResult {
    const queryParams = querystring.decode(uri.split('?')[1] || '') as Record<string, string>

    if (this.isValidQuery(queryParams)) {
      return this.query(queryParams as QueryParams)
    } else {
      console.error('Invalid or unrecognized request:', JSON.stringify(queryParams))
      return {
        status: 403,
        headers: {},
        body: JSON.stringify({ error: 'Invalid query parameters' }),
      }
    }
  }

  // ------------ private functions -----------

  private isValidQuery(params: Record<string, string>): boolean {
    try {
      const sessionOk = 'sessid' in params && this.sessions.has(params.sessid)
      const hOk = 'h' in params && this.isValidH(params.h)
      const xcmdOk: boolean =
        'xcmd' in params
          ? NetDaniaDouble.isValidXCMD(NetDaniaDouble.base64JsonDecode(params.xcmd) as XCmd[])
          : true
      const vOk = 'v' in params ? params.v === '5' : true

      const result: boolean = params.dt === '0' && vOk && (sessionOk || hOk) && xcmdOk
      // const ts = NetDaniaDouble.isValidTs(obj.ts) // seems optional
      if (!result) {
        console.debug(`isValidConnectQuery: h=${hOk}, cmd=${xcmdOk} => result=${result}`)
      }
      return result
    } catch (e) {
      console.log(`connect query check failed for ${JSON.stringify(params)}:`, e)
      return false
    }
  }

  private query(queryParams: QueryParams): ReplyResult {
    const responseBody = []

    // we either have sessid or h param is valid already
    const sessid = queryParams.sessid ?? NetDaniaDouble.mkSessionId()

    if (!queryParams.sessid) {
      responseBody.push({ v: 5 })
      responseBody.push({ s: 0, m: sessid })
    }

    // if xcmd is present, process it
    const xcmd: XCmd[] = queryParams.xcmd ? NetDaniaDouble.base64JsonDecode(queryParams.xcmd) : []
    const existingInstrumentsForSession = this.sessions.get(sessid) ?? []
    const newInstruments = xcmd
      .filter((cmd) => !existingInstrumentsForSession.find((v) => v[0] === cmd.i))
      .map((cmd) => [cmd.i, cmd.s]) as [number, string][]
    // instantiate new InstrumentData
    newInstruments.forEach((instrument) => {
      this.instrumentData.set(instrument[1], new InstrumentData(instrument[1]))
    })

    let instruments
    if (newInstruments.length === 0) {
      instruments = existingInstrumentsForSession
    } else {
      instruments = [...existingInstrumentsForSession, ...newInstruments]
      this.sessions.set(sessid, instruments)
    }

    instruments.forEach(([id, instrument]) => {
      const sample = this.instrumentData.get(instrument)?.sample() ?? []
      responseBody.push({
        t: 2,
        i: id,
        f: sample.map((s) => s.f),
        v: sample.map((s) => s.v),
      })
    })

    console.trace('response:', JSON.stringify(responseBody))

    return {
      status: 200,
      headers: {
        'Content-Type': 'text/json;charset=UTF-8',
        Pragma: 'no-cache',
        Expires: '0',
        CacheControl: 'no-cache',
        'Cache-Control': 'no-cache',
        Connection: 'close',
      },
      body: JSON.stringify(responseBody),
    }
  }

  private isValidH(h: string): boolean {
    const { g, ai, pr, au, qup, p } = NetDaniaDouble.base64JsonDecode(h)
    return (
      g === 'chain.link' &&
      ai === 'NodeJSAPIv1.5.2' &&
      pr === 2 &&
      au === 'localhost:8080' &&
      qup === 1 &&
      p === this.expectedPassword
    )
  }
}
