import { getFormattedDateStrings } from '../../src/transport/dateutils'

describe('dateutils test', () => {
  describe('getFormattedDateStrings', () => {
    it('happy path, 1 day lookback', () => {
      const date = new Date('2024-05-24T14:00:00Z')
      const formattedDateArray = [
        // dd-MM-YYYY
        '24-05-2024',
      ]

      const result = getFormattedDateStrings(1, date.getTime())
      expect(result).toEqual(formattedDateArray)
    })

    it('month carryover, 10 day lookback', () => {
      const date = new Date('2024-06-05T14:00:00Z')
      const formattedDateArray = [
        // dd-MM-YYYY
        '05-06-2024',
        '04-06-2024',
        '03-06-2024',
        '02-06-2024',
        '01-06-2024',
        '31-05-2024',
        '30-05-2024',
        '29-05-2024',
        '28-05-2024',
        '27-05-2024',
      ]

      const result = getFormattedDateStrings(10, date.getTime())
      expect(result).toEqual(formattedDateArray)
    })
  })
})
