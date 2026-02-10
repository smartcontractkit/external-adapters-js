import { Adapter } from '@chainlink/external-adapter-framework/adapter'
import commandLineArgs from 'command-line-args'
import commandLineUsage from 'command-line-usage'
import fs from 'fs'
import path from 'path'
import process from 'process'
import { getWorkspaceAdapters, WorkspaceAdapter } from '../workspace'

// Output types for the generated JSON
interface ParamOutput {
  name: string
  aliases: string[]
  type?: string
  required?: boolean
  description?: string
  options?: string[]
  default?: unknown
  dependsOn?: string[]
  exclusive?: string[]
}

interface EndpointOutput {
  name: string
  aliases: string[]
  parameters: ParamOutput[]
}

interface AdapterOutput {
  endpoints: EndpointOutput[]
}

type Result = Record<string, AdapterOutput>

// Loose type for framework's input parameter definition entry (may have nested type as object)
interface DefinitionEntry {
  aliases?: string[]
  type?: string | Record<string, unknown>
  required?: boolean
  description?: string
  options?: readonly string[]
  default?: unknown
  dependsOn?: string[]
  exclusive?: string[]
  array?: boolean
}

function definitionToParams(
  definition: Record<string, DefinitionEntry>,
  pathPrefix: string[] = [],
): ParamOutput[] {
  const params: ParamOutput[] = []
  for (const [param, attrs] of Object.entries(definition)) {
    const name = pathPrefix.length ? [...pathPrefix, param].join('.') : param
    const typeStr = typeof attrs.type === 'object' ? 'object' : (attrs.type as string) ?? ''
    const typeWithArray = typeStr + (attrs.array ? '[]' : '')
    params.push({
      name,
      aliases: Array.isArray(attrs.aliases) ? [...attrs.aliases] : [],
      type: typeWithArray || undefined,
      required: attrs.required,
      description: attrs.description,
      options: attrs.options ? [...attrs.options] : undefined,
      default: attrs.default,
      dependsOn: attrs.dependsOn ? [...attrs.dependsOn] : undefined,
      exclusive: attrs.exclusive ? [...attrs.exclusive] : undefined,
    })
    if (typeof attrs.type === 'object' && attrs.type !== null) {
      params.push(
        ...definitionToParams(attrs.type as Record<string, DefinitionEntry>, [
          ...pathPrefix,
          param,
        ]),
      )
    }
  }
  return params
}

async function loadAdapter(adapterPath: string): Promise<Adapter | null> {
  const distPath = path.join(process.cwd(), adapterPath, 'dist', 'index.js')
  if (!fs.existsSync(distPath)) {
    console.error(
      `Skipping ${adapterPath}: dist/index.js not found. Run "yarn build" for this adapter first.`,
    )
    return null
  }
  try {
    const mod = await import(distPath)
    const adapter = mod?.adapter
    if (!adapter || !adapter.endpoints) {
      console.error(`Skipping ${adapterPath}: no adapter or adapter.endpoints exported.`)
      return null
    }
    return adapter as Adapter
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    console.error(`Skipping ${adapterPath}: failed to load - ${message}`)
    return null
  }
}

function extractAdapterOutput(adapter: Adapter): AdapterOutput {
  const endpoints: EndpointOutput[] = (adapter.endpoints || []).map((ep) => {
    const definition = ep.inputParameters?.definition ?? ({} as Record<string, DefinitionEntry>)
    const parameters = definitionToParams(definition)
    return {
      name: ep.name,
      aliases: Array.isArray(ep.aliases) ? [...ep.aliases] : [],
      parameters,
    }
  })
  return { endpoints }
}

function resolveAdapters(
  requested: string[],
  allV3Sources: WorkspaceAdapter[],
): WorkspaceAdapter[] {
  const resolved: WorkspaceAdapter[] = []
  for (const name of requested) {
    const normalized = name.replace(/-adapter$/, '')
    const match = allV3Sources.find(
      (a) =>
        a.descopedName === name ||
        a.descopedName === normalized ||
        a.descopedName.replace(/-adapter$/, '') === normalized ||
        a.location === name ||
        a.location.endsWith('/' + name) ||
        a.location.endsWith('/' + normalized),
    )
    if (match) {
      resolved.push(match)
    } else {
      console.error(`Adapter not found or not an EAv3 source: ${name}`)
    }
  }
  return resolved
}

const optionDefinitions = [
  {
    name: 'config',
    alias: 'c',
    type: String,
    description: 'Path to a JSON file containing an array of adapter names',
  },
  {
    name: 'adapters',
    alias: 'a',
    type: String,
    multiple: true,
    description: 'Adapter names (e.g. data-engine wisdomtree)',
  },
  {
    name: 'all',
    type: Boolean,
    description: 'Include all EAv3 source adapters in the workspace',
  },
  {
    name: 'output',
    alias: 'o',
    type: String,
    description: 'Write JSON to this file instead of stdout',
  },
  {
    name: 'help',
    alias: 'h',
    type: Boolean,
    description: 'Show usage',
  },
]

async function main(): Promise<void> {
  const options = commandLineArgs(optionDefinitions)

  if (options.help) {
    const usage = commandLineUsage([
      {
        header: 'List EAv3 adapter endpoints and parameters',
        content:
          'Loads built EAv3 source adapters and prints structured JSON with endpoints (name, aliases) and input parameters (name, aliases, type, etc.). Adapters must be built first (yarn build).',
      },
      { optionList: optionDefinitions },
      {
        content: [
          'Examples:',
          '  yarn list-ea-endpoints --all',
          '  yarn list-ea-endpoints --adapters data-engine wisdomtree',
          '  yarn list-ea-endpoints --config adapters.json --output schema.json',
        ],
      },
    ])
    console.log(usage)
    process.exit(0)
  }

  const allAdapters = getWorkspaceAdapters()
  const allV3Sources = allAdapters.filter((a) => a.type === 'sources' && a.framework === '3')

  let toProcess: WorkspaceAdapter[] = []
  if (options.all) {
    toProcess = allV3Sources
  } else if (options.config) {
    const configPath = path.resolve(process.cwd(), options.config)
    if (!fs.existsSync(configPath)) {
      console.error(`Config file not found: ${configPath}`)
      process.exit(1)
    }
    const list = JSON.parse(fs.readFileSync(configPath, 'utf-8')) as string[]
    if (!Array.isArray(list)) {
      console.error('Config file must contain a JSON array of adapter names.')
      process.exit(1)
    }
    toProcess = resolveAdapters(list, allV3Sources)
  } else if (options.adapters?.length) {
    toProcess = resolveAdapters(options.adapters, allV3Sources)
  } else {
    console.error('Provide --all, --config <file>, or --adapters <name>... (or --help).')
    process.exit(1)
  }

  if (toProcess.length === 0) {
    console.error('No adapters to process.')
    process.exit(1)
  }

  const result: Result = {}
  for (const adapterMeta of toProcess) {
    const adapter = await loadAdapter(adapterMeta.location)
    if (adapter) {
      result[adapter.name] = extractAdapterOutput(adapter)
    }
  }

  const json = JSON.stringify(result, null, 2)
  if (options.output) {
    const outPath = path.resolve(process.cwd(), options.output)
    fs.writeFileSync(outPath, json, 'utf-8')
    console.error(`Written to ${outPath}`)
  } else {
    console.log(json)
  }
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
