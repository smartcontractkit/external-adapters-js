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
 * - it doesn't support updating requests, i.e. for the same id to start querying in different ways.
 * - it would be nice to have the prices actually vary, or be read from raw-price-updates.jsonl
 */
export class NetDaniaDouble {
  private static instance: NetDaniaDouble | undefined = undefined
  private expectedPassword!: string

  private constructor(cfg: typeof config.settings) {
    // Private constructor to prevent instantiation
    this.expectedPassword = cfg.NETDANIA_PASSWORD
  }

  public static getInstance(cfg: typeof config.settings): NetDaniaDouble {
    if (!NetDaniaDouble.instance) {
      NetDaniaDouble.instance = new NetDaniaDouble(cfg)
    }
    return NetDaniaDouble.instance
  }

  // public reset(): void {
  //   // Reset any state if needed
  // }

  private sessions: Map<string, [number, string][]> = new Map()

  // instrument data is associated with an instrument name, shared across all sessions
  private instrumentData: Map<string, InstrumentData> = new Map()

  /** entrypoint */
  public streaming(uri: string): ReplyResult {
    const queryParams = querystring.decode(uri.split('?')[1] || '') as Record<string, string>

    if (this.isValidQuery(queryParams)) {
      return this.query(queryParams as QueryParams)
    } else {
      console.error('Invalid or unrecognized request:', queryParams)
      return {
        status: 403,
        headers: {},
        body: JSON.stringify({ error: 'Invalid query parameters' }),
      }
    }
  }

  /*
    private connect(queryParams: QueryParams): ReplyResult {
      console.debug('NetDaniaDouble: connect(); uri:', JSON.stringify(queryParams))

      // the logic seems to be to associate with a sessionId an array of (at least) (instrumentId, instrumentName)
      // however, for the sake of simplicity, we will just keep the requested instrumentId
      const xcmd: XCmd[] = NetDaniaDouble.base64JsonDecode(queryParams.xcmd)
      console.debug('NetDaniaDouble: connect(); xcmd:', xcmd)
      const instrumentIdsRequested = xcmd.map((cmd) => cmd.i)
      const newSessionId = this.mkSessionId()
      this.sessions.set(newSessionId, instrumentIdsRequested)

      const version = { v: 5 }
      const session = { s: 0, m: newSessionId }
      const priceDataResponse: PriceDataResponse = {
        t: 2,
        i: instrumentIdsRequested[0], // just one for now
        f: [
          300, 11, 13, 1023, 1020, 1021, 1022, 1024, 3015, 10, 12, 1013, 3004, 3001, 3002, 3003, 3005,
          3014, 9, 3010, 3007, 3008, 3009, 3011, 3013, 6, 4, 2, 3, 17, 152, 5, 8, 111, 110, 25, 39,
          1029, 115, 247, 23, 1531, 1532, 1, 19, 21, 22, 27, 28, 29, 30, 43, 44, 47, 48, 49, 50, 51,
          52, 53, 54, 55, 56, 57, 58, 59, 60, 61, 62, 63, 64, 65, 66, 67, 68, 69, 70, 71, 72, 73, 74,
          75, 76, 77, 78, 79, 80, 81, 82, 83, 84, 85, 86, 87, 88, 89, 90, 117, 120, 121, 122, 123,
          124, 125, 126, 127, 129, 130, 138, 147, 1002, 1015, 1025, 3012,
        ],
        v: [
          '10',
          '1.17205',
          'N/A',
          'N/A',
          '1.1684',
          '1.1747',
          '1.16675',
          '1750932850',
          '1750932850145',
          '1.17193',
          'N/A',
          'N/A',
          'N/A',
          'N/A',
          'N/A',
          'N/A',
          '0',
          '0',
          '1.17199',
          'N/A',
          '1.16834',
          '1.17454',
          '1.16673',
          '1750932850',
          '1750932850145',
          'N/A',
          '1.16828',
          '1.17451',
          '1.16651',
          '1750932850',
          '1750932850145',
          'N/A',
          'N/A',
          'N/A',
          'SQZ',
          'EUR USD',
          'FXEURUSD',
          '8',
          'FX',
          'FX',
          'FOREX',
          'GMT',
          '',
          '1.16834',
          '1.04055',
          '1.16848',
          '1.01768',
          '1.14755',
          '1.13606',
          '1.07883',
          '1.07092',
          '1.16848',
          '1.01768',
          '0.7302',
          '0.7602',
          '0.759',
          '0.809',
          '2.233',
          '2.249',
          '5.33',
          '5.46',
          '10.785',
          '10.815',
          '16.18',
          '16.24',
          '23.93',
          '24.13',
          '46.24',
          '46.56',
          '71.06',
          '71.23',
          '94.19',
          '94.88',
          '114.2',
          '115.1',
          '139.17',
          '139.97',
          '159.35',
          '162.85',
          '177.74',
          '179.94',
          '198.42',
          '200.92',
          '217.45',
          '222.45',
          '234.46',
          '239.96',
          '252.77',
          '255.67',
          '425.1',
          '431.4',
          '581.58',
          '601.58',
          '722.18',
          '744.18',
          '861.31',
          '906.31',
          '1.03988',
          '1.16848',
          '1.14436',
          '1.16848',
          '1.12098',
          '1.16848',
          '1.07325',
          '1.16848',
          '1.01768',
          '345.42',
          '350.42',
          '0',
          'EURUSD',
          '1750896000000',
          '1.16834',
          '1.16836',
          '1.16835',
        ],
      }

      const body = [version, session, priceDataResponse]

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
        body: JSON.stringify(body),
      }
    }
  */

  private query(queryParams: QueryParams): ReplyResult {
    console.debug('NetDaniaDouble: query() called with uri: ', JSON.stringify(queryParams))

    const responseBody = []

    // we either have sessid or h param is valid already
    const sessid = queryParams.sessid ?? NetDaniaDouble.mkSessionId()

    if (!queryParams.sessid) {
      responseBody.push({ v: 5 })
      responseBody.push({ s: 0, m: sessid })
    }

    // if xcmd is present, process it
    const xcmd: XCmd[] = queryParams.xcmd ? NetDaniaDouble.base64JsonDecode(queryParams.xcmd) : []
    console.debug('NetDaniaDouble: xcmd:', xcmd)
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

    console.debug('response:', JSON.stringify(responseBody))

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

  public static base64JsonDecode(s: string) {
    return JSON.parse(Buffer.from(s.replace(/\./g, '='), 'base64').toString('utf-8'))
  }

  // ------------ private functions -----------

  public isValidQuery(params: Record<string, string>): boolean {
    try {
      const sessionOk = 'sessid' in params && this.sessions.has(params.sessid)
      const hOk = 'h' in params && this.isValidH(params.h)
      const xcmdOk: boolean =
        'xcmd' in params
          ? NetDaniaDouble.isValidXCMD(NetDaniaDouble.base64JsonDecode(params.xcmd))
          : true
      const vOk = 'v' in params ? params.v === '5' : true

      const result: boolean = params.dt === '0' && vOk && (sessionOk || hOk) && xcmdOk
      console.debug("isValidQuery: result=", result)
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

  private static mkSessionId(): string {
    return 'UP' + Math.floor(Math.random() * 1000000).toString()
  }

  private static isValidXCMD(parsed: any): boolean {
    let result = false
    try {
      result =
        Array.isArray(parsed) &&
        parsed.length >= 1 &&
        parsed.every(
          (c: XCmd) =>
            c.t === 1 &&
            c.m === 1 &&
            c.s.length === 6 &&
            c.p === 'idc'
        )
    } catch (e) {
      console.debug('invalid XCMD: ', JSON.stringify(parsed), e)
    }
    if (!result) {
      console.debug('invalid XCMD', JSON.stringify(parsed))
    }
    return result
  }

/*
  private static isValidTs(ts: string): boolean {
    const tsNum = parseInt(ts, 10)
    return !isNaN(tsNum) && tsNum > 0 && tsNum < Date.now() + 1000
  }
*/
}
