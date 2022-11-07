import axios from 'axios'
import path from 'node:path'
import fs from 'node:fs/promises'
import { uniq } from 'lodash'

const DATA_URL = 'https://api.cryptoscamdb.org/v1/scams'
const CDN_DATA_URL = 'some link'

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

interface OnlineSiteInfo {
  name: string
  url: string
  path: string
  category?: number
  subcategory?: number
  description: string
}

interface OnlineCategory {
  id: number
  value: string
}

// @ts-ignore
const outputDir = path.join(process.env.PWD, 'providers/cryptoscan-db')

async function writeWebsiteToFile(data: OnlineSiteInfo[]) {
  await fs.writeFile(path.join(outputDir, `list.json`), JSON.stringify(data), {
    encoding: 'utf-8',
  })
}

async function writeCategoriesToFile(key: 'categories' | 'sub-categories', data: OnlineCategory[]) {
  await fs.writeFile(path.join(outputDir, `${key}.json`), JSON.stringify(data), {
    encoding: 'utf-8',
  })
}

async function getCategories(key: 'categories' | 'sub-categories', list: string[]): Promise<OnlineCategory[]> {
  // const online = await axios.get<{ id: number; value: string }[]>(urlcat(CDN_DATA_URL, key))
  const onlineCategories: OnlineCategory[] = []
  const newCategories = list.filter((x) => !onlineCategories.find((c) => x === c.value))
  const newList = uniq(newCategories)
    .filter(Boolean)
    .map((x, i) => ({ id: i + onlineCategories.length, value: x } as OnlineCategory))

  return [...onlineCategories, ...newList]
}

async function main() {
  const result = await axios.get<Response>(DATA_URL)
  if (!result.data.success) {
    console.log('Fetch db data from API failed!')
    return
  }

  const list = result.data.result

  const categories = await getCategories(
    'categories',
    list.map((x) => x.category),
  )
  const subCategories = await getCategories(
    'sub-categories',
    list.map((x) => x.subcategory),
  )

  const sites = list.map((x) => {
    const category = categories.find((c) => c.value === x.category)
    const subCategory = subCategories.find((c) => c.value === x.subcategory)
    return {
      name: x.name,
      url: x.url,
      path: x.path,
      category: category?.id,
      subcategory: subCategory?.id,
      description: x.description,
    }
  })
  await writeWebsiteToFile(sites)
  await writeCategoriesToFile('categories', categories)
  await writeCategoriesToFile('sub-categories', subCategories)
}

main()
