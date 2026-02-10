import { Adapter } from '@chainlink/external-adapter-framework/adapter'
import fs from 'fs'
import path from 'path'
import { getWorkspaceAdapters } from '../workspace'

const OUTPUT_PATH = 'packages/streams-adapter/endpoint_aliases.json'

interface ParamSpec {
  aliases?: string[]
  required: boolean
}

interface EndpointConfig {
  aliases?: string[]
  params?: Record<string, ParamSpec>
}

interface AdapterConfig {
  endpoints?: Record<string, EndpointConfig>
}

interface AllAdaptersConfig {
  adapters: Record<string, AdapterConfig>
}

interface DefinitionEntry {
  aliases?: string[]
  required?: boolean
}

interface LoadResult {
  adapter: Adapter | null
  skipReason?: string
}

async function loadAdapter(adapterPath: string): Promise<LoadResult> {
  const distPath = path.join(process.cwd(), adapterPath, 'dist', 'index.js')
  if (!fs.existsSync(distPath)) {
    return { adapter: null, skipReason: 'dist/index.js not found' }
  }
  try {
    const mod = await import(distPath)
    const adapter = mod?.adapter
    if (!adapter?.endpoints) {
      return { adapter: null, skipReason: 'no adapter.endpoints exported' }
    }
    return { adapter: adapter as Adapter }
  } catch (err) {
    return { adapter: null, skipReason: err instanceof Error ? err.message : String(err) }
  }
}

function extractAdapterConfig(adapter: Adapter): AdapterConfig {
  const endpoints: Record<string, EndpointConfig> = {}

  for (const ep of adapter.endpoints || []) {
    const canonicalName = ep.name.toLowerCase()
    const allAliases = [canonicalName]

    if (Array.isArray(ep.aliases)) {
      for (const alias of ep.aliases) {
        const lower = alias.toLowerCase()
        if (!allAliases.includes(lower)) allAliases.push(lower)
      }
    }

    const params: Record<string, ParamSpec> = {}
    const definition = (ep.inputParameters?.definition ?? {}) as Record<string, DefinitionEntry>

    for (const [paramName, attrs] of Object.entries(definition)) {
      const canonicalParam = paramName.toLowerCase()
      const paramAliases: string[] = []

      if (Array.isArray(attrs.aliases)) {
        for (const alias of attrs.aliases) {
          const lower = alias.toLowerCase()
          if (!paramAliases.includes(lower)) paramAliases.push(lower)
        }
      }

      params[canonicalParam] = {
        aliases: paramAliases.length > 0 ? paramAliases : undefined,
        required: attrs.required === true,
      }
    }

    endpoints[canonicalName] = {
      aliases: allAliases.length > 0 ? allAliases : undefined,
      params: Object.keys(params).length > 0 ? params : undefined,
    }
  }

  return { endpoints: Object.keys(endpoints).length > 0 ? endpoints : undefined }
}

async function main(): Promise<void> {
  const allAdapters = getWorkspaceAdapters()
  const v3Sources = allAdapters.filter((a) => a.type === 'sources' && a.framework === '3')
  const v2Sources = allAdapters.filter((a) => a.type === 'sources' && a.framework !== '3')

  if (v3Sources.length === 0) {
    console.error('No EAv3 source adapters found')
    process.exit(1)
  }

  const result: AllAdaptersConfig = { adapters: {} }
  const skipped: { name: string; reason: string }[] = []

  for (const meta of v3Sources) {
    const { adapter, skipReason } = await loadAdapter(meta.location)
    if (adapter) {
      // Use directory name (lowercase, without -adapter suffix) as the key to match Go parser
      const adapterKey = meta.descopedName.replace(/-adapter$/, '')
      result.adapters[adapterKey] = extractAdapterConfig(adapter)
    } else {
      skipped.push({ name: meta.descopedName, reason: skipReason || 'unknown' })
    }
  }

  const outPath = path.resolve(process.cwd(), OUTPUT_PATH)
  fs.writeFileSync(outPath, JSON.stringify(result, null, 2), 'utf-8')
  console.log(`Written ${Object.keys(result.adapters).length} EAv3 adapters to ${OUTPUT_PATH}`)

  if (skipped.length > 0) {
    console.log(`\nSkipped ${skipped.length} EAv3 adapters:`)
    for (const { name, reason } of skipped) {
      console.log(`  - ${name}: ${reason}`)
    }
  }

  if (v2Sources.length > 0) {
    console.log(`\nExcluded ${v2Sources.length} EAv2 adapters (not supported):`)
    for (const a of v2Sources) {
      console.log(`  - ${a.descopedName}`)
    }
  }
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
