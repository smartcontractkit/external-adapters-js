import { SettingsDefinitionFromConfig } from '@chainlink/external-adapter-framework/config'
import {
  TestAdapter,
  setEnvVariables,
} from '@chainlink/external-adapter-framework/util/testing-utils'
import * as nock from 'nock'
import { config } from '../../src/config'

type SettingsDefinition = SettingsDefinitionFromConfig<typeof config>

describe('execute', () => {
  let spy: jest.SpyInstance
  let testAdapter: TestAdapter<SettingsDefinition>
  let oldEnv: NodeJS.ProcessEnv

  beforeAll(async () => {
    oldEnv = JSON.parse(JSON.stringify(process.env))
    const timezone = 'America/New_York'
    process.env.NYMEX_REGULAR_SCHEDULE = JSON.stringify({
      timezone,
      lastValidDate: '2027-01-01',
      defaultStatus: 'CLOSED',
      weekly: [
        {
          status: 'OPEN',
          when: [
            {
              days: ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY'],
              times: [
                {
                  start: '09:30:00',
                  end: '16:00:00',
                },
              ],
            },
          ],
        },
      ],
      exceptions: [],
    })
    process.env.NYSE_24_5_SCHEDULE = JSON.stringify({
      timezone,
      lastValidDate: '2027-01-01',
      defaultStatus: 'WEEKEND',
      weekly: [
        {
          status: 'REGULAR',
          when: [
            {
              days: ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY'],
              times: [
                {
                  start: '09:30:00',
                  end: '16:00:00',
                },
              ],
            },
          ],
        },
      ],
      exceptions: [],
    })

    const mockDate = new Date('2001-01-01T11:11:11.111Z')
    spy = jest.spyOn(Date, 'now').mockReturnValue(mockDate.getTime())

    const adapter = (await import('./../../src')).adapter
    adapter.rateLimiting = undefined
    testAdapter = await TestAdapter.startWithMockedCache(adapter, {
      testAdapter: {} as TestAdapter<SettingsDefinition>,
    })
  })

  afterAll(async () => {
    setEnvVariables(oldEnv)
    await testAdapter.api.close()
    nock.restore()
    nock.cleanAll()
    spy.mockRestore()
  })

  describe('market-status endpoint', () => {
    it('should return success for regular schedule', async () => {
      const data = {
        market: 'nymex',
        type: 'regular',
      }

      const response = await testAdapter.request(data)
      expect(response.json()).toMatchSnapshot()
      expect(response.statusCode).toBe(200)
    })

    it('should return success for 24/5 schedule', async () => {
      const data = {
        market: 'nyse',
        type: '24/5',
        weekend: '520-020:America/New_York',
      }

      const response = await testAdapter.request(data)
      expect(response.json()).toMatchSnapshot()
      expect(response.statusCode).toBe(200)
    })
  })
})
