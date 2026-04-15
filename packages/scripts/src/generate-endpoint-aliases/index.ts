import { Adapter } from '@chainlink/external-adapter-framework/adapter'
import fs from 'fs'
import path from 'path'
import { getWorkspaceAdapters } from '../workspace'

const OUTPUT_PATH = 'packages/streams-adapter/endpoint_aliases.json'

interface EndpointConfig {
  aliases?: string[]
}

interface AllAdaptersConfig {
  adapters: Record<string, { endpoints?: Record<string, EndpointConfig> }>
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

function extractEndpoints(adapter: Adapter): Record<string, EndpointConfig> | undefined {
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

    endpoints[canonicalName] = {
      aliases: allAliases.length > 0 ? allAliases : undefined,
    }
  }

  return Object.keys(endpoints).length > 0 ? endpoints : undefined
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
      const adapterKey = meta.descopedName.replace(/-adapter$/, '')
      result.adapters[adapterKey] = { endpoints: extractEndpoints(adapter) }
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
