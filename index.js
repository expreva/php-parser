import { writeFileSync, existsSync, mkdtempSync } from 'fs'
import { rootCertificates } from 'tls'

import path, { dirname } from 'path'
import { fileURLToPath } from 'url'

import {
  LatestSupportedPHPVersion,
  // SupportedPHPVersion,
  SupportedPHPVersionsList,
} from '@php-wasm/universal'

import { NodePHP } from '@php-wasm/node'
// import { spawn } from 'child_process'

const __dirname = dirname(fileURLToPath(import.meta.url))

export async function createPhp(options = {}) {
  const { phpVersion = LatestSupportedPHPVersion } = options
  if (!SupportedPHPVersionsList.includes(phpVersion)) {
    throw new Error(`Unsupported PHP version ${phpVersion}`)
  }

  const php = await NodePHP.load(phpVersion, {
    emscriptenOptions: {
      ENV: {
        ...process.env,
        TERM: 'xterm',
      },
    },
  })

  // php.useHostFilesystem()
  php.mount(__dirname + '/parser', '/parser')

  php.parse = (...args) => parsePhp(php, ...args)

  return php
}

async function parsePhp(php, code) {
  const result = await php.run({
    code: `<?php
include_once __DIR__ . '/parser/index.php';

$code = <<<'CODE'
${code}
CODE;

$result = parse_php($code);
echo json_encode($result);
`,
  })

  if (result.error) {
    return {
      error: result.error,
    }
  }
  try {
    const { parsed } = JSON.parse(result.text)
    return {
      parsed
    }
  } catch (error) {
    return {
      error,
      invalidResult: result.text,
    }
  }
}
