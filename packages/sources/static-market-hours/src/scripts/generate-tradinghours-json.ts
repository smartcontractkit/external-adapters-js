import commandLineArgs from 'command-line-args'
import commandLineUsage from 'command-line-usage'
import { ScheduleGenerator } from './schedule_generator'

const OPTION_FIN_ID = 'fin-id'
const OPTION_CSV_DIR = 'csv-dir'

export async function main(): Promise<void | string> {
  try {
    // Define CLI options
    const commandLineOptions = [
      {
        name: OPTION_FIN_ID,
        type: String,
        required: true,
        description: 'The FIN ID of the market to generate schedule JSON for.',
      },
      {
        name: OPTION_CSV_DIR,
        type: String,
        required: true,
        description: 'The directory containing the TradingHours CSV files.',
      },
      { name: 'help', alias: 'h', type: Boolean, description: 'Display usage guide' },
    ]
    const options = commandLineArgs(commandLineOptions)

    // Generate usage guide
    if (options.help) {
      const usage = commandLineUsage([
        {
          header: 'Generate TradingHours schedule JSON',
          content:
            'This script generates JSON configuration to be used by the static-market-hours adapter to serve market status for a given market.',
        },
        {
          header: 'Options',
          optionList: commandLineOptions,
        },
        {
          content:
            'Source code: {underline https://github.com/smartcontractkit/external-adapters-\njs/packages/scripts/src/generate-tradinghours-json/}',
        },
      ])
      console.log(usage)
      return
    }

    const missingRequiredOptions = []
    for (const option of commandLineOptions) {
      if (option.required && !options[option.name]) {
        missingRequiredOptions.push(option.name)
      }
    }

    if (missingRequiredOptions.length > 0) {
      console.error(`Missing required options: --${missingRequiredOptions.join(', --')}.`)
      console.error('Use --help to see usage guide.')
      process.exit(1)
    }

    const csvDir = options[OPTION_CSV_DIR]
    const finId = options[OPTION_FIN_ID]

    const generator = new ScheduleGenerator({ csvDir, finId })
    console.log(JSON.stringify(generator.getSchedule(), null, 2))

    process.exit(0)
  } catch (e: unknown) {
    const error = e as Error
    console.error({ error: error.message, stack: error.stack })
    process.exit(1)
  }
}

main()
