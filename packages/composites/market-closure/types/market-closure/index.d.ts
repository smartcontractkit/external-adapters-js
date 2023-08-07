declare module 'market-closure' {
  export interface Schedule {
    // Expects a timezone (e.g. "Europe/London"). See Luxon's documentation for more information:
    // https://moment.github.io/luxon/docs/manual/zones
    timezone: string
    // Hours is the trading hours per day where the market is open. See checkIfInHours() for more information on how
    // this works. This object can be omitted or set to null to consider all days open.
    hours: Record<string, string[]>
    // Holidays is an array of holidays where the market is closed. See checkIfInHolidays() for more information.
    holidays: Record<string, number | string>[]
  }

  export class MarketClosure {
    constructor(schedule: Schedule): MarketClosure

    // Checks if trading is halted according to the schedule
    tradingHalted(): boolean

    // Expects an object of days with an array of trading hours. Eg:
    // {
    //   monday: ["08:00-12:00", "13:00-16:00"],
    //   tuesday: ["08:00-12:00", "13:00-16:00"]
    // }
    // If a day is not included, then the entire day is considered closed.
    // If no days are provided, all days are considered open.
    isInTradingHours(time: DateTime): boolean

    // Expects an array of objects with holidays. E.g.
    // [
    //   {
    //     year: 2020,
    //     month: 5,
    //     day: 8,
    //     hours: "12:30-23:59"
    //   },
    //   {
    //     year: 2020,
    //     month: 5,
    //     day: 9,
    //     hours: "00:00-23:59"
    //   }
    // ]
    // The hours is the time the markets are closed.
    // Hours can be omitted to consider the entire day as closed.
    isInHolidays(time: DateTime): boolean
  }
}
