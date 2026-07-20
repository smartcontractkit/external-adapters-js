import commandLineArgs from 'command-line-args'
import commandLineUsage from 'command-line-usage'
import path from 'path'
import { getWorkspaceAdapters, WorkspaceAdapter } from '../workspace'

const getNameFromLocation = (adapter: WorkspaceAdapter): string => {
  return adapter.location.split('/').at(-1)!
}

const getSelfReportedAdapterName = async (adapter: WorkspaceAdapter) => {
  const adapterPath = path.join(process.cwd(), adapter.location, 'src/index.ts')
  const adapterModule = await require(adapterPath)

  if ('adapter' in adapterModule) {
    // V3 framework adapter
    return adapterModule.adapter.name
  }
  // V2 framework adapter
  return adapterModule.NAME
}

const getExpectedSelfReportedName = (adapter: WorkspaceAdapter) => {
  const nameFromLocation = getNameFromLocation(adapter)
  // Grand-father non-matching adapters:
  switch (nameFromLocation) {
    case 'crypto-volatility-index':
      return 'CVI'
    case 'liveart':
      return 'LIVE_ART'
    case 'wbtc-address-set':
      return 'WBTC'
    case 'bitgo-reserves-test':
    case 'ix-trust-sync':
      // Replaces only the first hyphen with an underscore.
      return nameFromLocation.toUpperCase().replace(/-/, '_')
    case 'finnhub-secondary':
    case 'frxeth-exchange-rate':
    case 'harris-and-trotter':
    case 'ion.au':
    case 'moore-hk':
      // Does not replace special characters with underscores.
      return nameFromLocation.toUpperCase()
  }
  return nameFromLocation.toUpperCase().replace(/\W/g, '_')
}

export async function main(): Promise<void | string> {
  try {
    // Define CLI options
    const commandLineOptions = [
      {
        name: 'adapters',
        multiple: true,
        defaultOption: true,
        description: 'Check names of given adapters. Leave empty to check all adapters.',
      },
      { name: 'help', alias: 'h', type: Boolean, description: 'Display usage guide' },
    ]
    const options = commandLineArgs(commandLineOptions)

    // Generate usage guide
    if (options.help) {
      const usage = commandLineUsage([
        {
          header: 'Check that adapter names match package name',
          content:
            'This script is run from the root of the external-adapter-js/ repo to check that the self reported name of each adapter matches the name of the package and directory.',
        },
        {
          header: 'Options',
          optionList: commandLineOptions,
        },
        {
          content:
            'Source code: {underline https://github.com/smartcontractkit/external-adapters-\njs/packages/scripts/src/check-adapter-names/}',
        },
      ])
      console.log(usage)
      return
    }

    let adapters = getWorkspaceAdapters()

    // If specific adapters are passed to the command line, only select those
    if (options.adapters?.length) {
      adapters = adapters.filter((a) => {
        return (options.adapters as string[]).includes(getNameFromLocation(a))
      })

      for (const adapterOption of options.adapters as string[]) {
        if (!adapters.find((a) => getNameFromLocation(a) === adapterOption)) {
          throw new Error(`Unknown adapter: '${adapterOption}'`)
        }
      }
    }

    for (const adapter of adapters) {
      const expectedPackageName = `@chainlink/${getNameFromLocation(adapter)}-adapter`
      if (adapter.name !== expectedPackageName) {
        throw new Error(
          `Adapter '${adapter.location}' should have package name '${expectedPackageName}' but has package name '${adapter.name}'`,
        )
      }

      if (adapter.location.startsWith('packages/non-deployable/')) {
        continue
      }

      const selfReportedName = await getSelfReportedAdapterName(adapter)
      const expectedSelfReportedName = getExpectedSelfReportedName(adapter)

      if (selfReportedName !== expectedSelfReportedName) {
        throw new Error(
          `Adapter '${adapter.location}' should self report name '${expectedSelfReportedName}' but self reports name '${selfReportedName}'`,
        )
      }

      console.log(`✅ ${getNameFromLocation(adapter)} / ${adapter.name} / ${selfReportedName}`)
    }

    process.exit(0)
  } catch (e: unknown) {
    const error = e as Error
    console.error({ error: error.message, stack: error.stack })
    process.exit(1)
  }
}

main()
