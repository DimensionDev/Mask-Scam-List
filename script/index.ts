import axios from 'axios'
import path from 'node:path'
import fs from 'node:fs/promises'
import { ScalableBloomFilter } from 'bloom-filters'

export const DATA_URL = 'https://api.cryptoscamdb.org/v1/scams'

export type Response = {
  success: boolean
  result: Array<Site>
}

interface Site {
  id: string
  name: string
  url: string
  path: string
  category: string
  subcategory: string
  description: string
  reporter: string
}
// @ts-ignore
const outputDir = path.join(process.env.PWD, 'providers/cryptoscam-db')

export async function writeSingleWebsiteToFile(website: string, data: Site) {
  await fs.writeFile(path.join(outputDir, `${website?.toLowerCase()}.json`), JSON.stringify(data), {
    encoding: 'utf-8',
  })
}

export async function writeFilterToFile(data: Site) {
  await fs.writeFile(path.join(outputDir, 'filter', 'config.json'), JSON.stringify(data), {
    encoding: 'utf-8',
  })
}

export async function main() {
  const result = await axios.get<Response>(DATA_URL)
  if (!result.data.success) {
    console.log('Fetch db data from API failed!')
    return
  }

  const list = result.data.result
  const filter = new ScalableBloomFilter(list.length)

  for (const site of list) {
    filter.add(site.name)
    await writeSingleWebsiteToFile(site.name, site)
  }

  const filterConfig = filter.saveAsJSON()
  await writeFilterToFile(filterConfig)

  // Make sure bloom filter is work
  const content = await fs.readFile(path.join(outputDir, 'filter', 'config.json'), { encoding: 'utf-8' })
  const contentJSON = JSON.parse(content)
  const importedFilter = ScalableBloomFilter.fromJSON(contentJSON)

  for (const item of list) {
    if (!importedFilter.has(item.name)) throw new Error('Bloom Filter create failed')
  }
}

main()
