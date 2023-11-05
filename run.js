#!/usr/bin/env node
import fs from 'node:fs/promises'
import { createPhp } from './index.js'

const args = process.argv.slice(2)
const fileName = args.shift()

if (!fileName) {
  console.log(`Usage: php-parser [file name]`)
} else {
  ;(async () => {
    const php = await createPhp()
    const content = await fs.readFile(fileName, 'utf8')
    const result = await php.parse(content)
    // { parsed, error }
    console.log(JSON.stringify(result, null, 2))
    process.exit()
  })().catch(console.error)
}
