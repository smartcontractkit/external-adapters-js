import * as create from '../../src/methods/createMarkets'
import * as resolve from '../../src/methods/resolveMarkets'

describe('packCreation', () => {
  const requests = [
    { name: 'empty data', testData: {
      eventId: "0",
        homeTeamId: 0,
        awayTeamId: 0,
        startTime: 0,
        homeSpread: 0,
        totalScore: 0
      },
      expect: "0x0000000000000000000000000000000000000000000000000000000000000000"
    },
    { name: 'realistic data', testData: {
        eventId: "9a35b8986a76eaaea364be331cb453ec",
        homeTeamId: 2929,
        awayTeamId: 2928,
        startTime: Date.parse("2020-02-02T23:30:00Z"),
        homeSpread: -4.499,
        totalScore: 0 // TODO: Clarify with them
      },
      expect: "0x9a35b8986a76eaaea364be331cb453ec0b710b705e375b78ffd3000000000000"
    },
  ]

  requests.forEach((req) => {
    it(`${req.name}`, async () => {
      const p = req.testData
      const got = create.packCreation(p.eventId, p.homeTeamId, p.awayTeamId, p.startTime, p.homeSpread, p.totalScore)
      expect(got).toEqual(req.expect)

      const bytes = Buffer.from(got.substr(2), 'hex').byteLength
      expect(bytes).toBe(32)
    })
  })
})

describe('packResolution', () => {
  const requests = [
    { name: 'empty data', testData: {
        eventId: "0",
        eventStatus: 0,
        homeScore: 0,
        awayScore: 0
      },
      expect: "0x0000000000000000000000000000000000000000000000000000000000000000"
    },
    { name: 'realistic data', testData: {
        eventId: "9a35b8986a76eaaea364be331cb453ec",
        eventStatus: 2,
        homeScore: 31,
        awayScore: 20
      },
      expect: "0x9a35b8986a76eaaea364be331cb453ec02013600c80000000000000000000000"
    },
  ]

  requests.forEach((req) => {
    it(`${req.name}`, async () => {
      const p = req.testData
      const got = resolve.packResolution(p.eventId, p.eventStatus, p.homeScore, p.awayScore)
      expect(got).toEqual(req.expect)

      const bytes = Buffer.from(got.substr(2), 'hex').byteLength
      expect(bytes).toBe(32)
    })
  })
})
