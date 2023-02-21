import axios from 'axios'
import path from 'node:path'
import fs from 'node:fs/promises'
import { ScalableBloomFilter } from 'bloom-filters'
import { config } from 'dotenv'

interface Site {
  id: string
  name: string
  description?: string
  url: string
  path: string
  category: string
  subcategory: string
  reporter?: string
}

interface SiteNode {
  node: {
    id: string
    csdbId: string
    category?: string
    subcategory: string
    name: string
    status: string
  }
}

interface SiteStatsNode {
  node: {
    actives: number
    addresses: number
    featured: number
    inactives: number
    scams: number
    verified: number
  }
}

interface Response {
  data: {
    allCsdbScamDomains: {
      edges: SiteNode[]
      totalCount: number
    }
    allCsdbStats: {
      edges: SiteStatsNode[]
    }
  }
  pageContext: {
    isCreatedByStatefulCreatePages: boolean
  }
}

// load env
config()

// @ts-ignore
const OUTPUT_DIR = path.join(process.env.PWD, 'providers/cryptoscam-db')

async function writeSingleWebsiteToFile(website: string, data: Site) {
  await fs.writeFile(path.join(OUTPUT_DIR, `${website?.toLowerCase()}.json`), JSON.stringify(data), {
    encoding: 'utf-8',
  })
}

async function writeFilterToFile(data: Site) {
  await fs.writeFile(path.join(OUTPUT_DIR, 'filter', 'config.json'), JSON.stringify(data), {
    encoding: 'utf-8',
  })
}

async function main() {
  const { data } = await axios.get<Response>(process.env.CRYPTO_SCAM_DB_URL)
  if (!data.data.allCsdbScamDomains.edges.length) {
    console.log('Fetch db data from API failed!')
    return
  }

  const list = data.data.allCsdbScamDomains.edges.map((x) => x.node)
  const filter = new ScalableBloomFilter(list.length)

  for (const site of list) {
    if (site.name === 'https') continue
    filter.add(site.name)
    await writeSingleWebsiteToFile(site.name, {
      id: site.csdbId,
      name: site.name,
      url: site.name.startsWith('http') ? site.name : `https://${site.name}`,
      category: site.category ?? '',
      subcategory: site.subcategory,
      path: '/*',
    })
  }

  const filterConfig = filter.saveAsJSON()
  await writeFilterToFile(filterConfig)

  // Make sure bloom filter is work
  const content = await fs.readFile(path.join(OUTPUT_DIR, 'filter', 'config.json'), { encoding: 'utf-8' })
  const contentJSON = JSON.parse(content)
  const importedFilter = ScalableBloomFilter.fromJSON(contentJSON)

  for (const item of list) {
    if (item.name === 'https') continue
    if (!importedFilter.has(item.name)) throw new Error('Bloom Filter create failed')
  }
}

main()
