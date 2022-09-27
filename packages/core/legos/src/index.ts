import sources from './sources'

const sourceNames = Object.values(sources).map((s: any) => {
  return s.NAME ? s.NAME : s.adapter.name
})

export default { sources: sourceNames }
