import path, { dirname } from 'path'
import { fileURLToPath } from 'url'
import {
  PHP,
  loadPHPRuntime,
  createNodeFsMountHandler,
  getPHPLoaderModule,
} from '@expreva/php-wasm-8-4'

const __dirname = dirname(fileURLToPath(import.meta.url))

export async function createPhp(options = {}) {
  const version = '8.4'

  const { TMPDIR, ...envVariables } = process.env
  const php = new PHP(
    await loadPHPRuntime(await getPHPLoaderModule(version), {
      emscriptenOptions: {
        ENV: {
          ...envVariables,
          TERM: 'xterm',
        },
      },
    })
  )

  const vfsPath = '/internal/parser'
  php.mkdir(vfsPath)
  await php.mount(
    vfsPath,
    createNodeFsMountHandler(path.join(__dirname, 'parser'))
  )
  php.parse = (...args) => parsePhp(php, ...args)

  return php
}

async function parsePhp(php, code) {
  const result = await php.run({
    code: `<?php
include_once __DIR__ . '/parser/index.php';

echo json_encode(parse_php(<<<'CODE'
${code}
CODE));
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
      parsed,
    }
  } catch (error) {
    return {
      error,
      invalidResult: result.text,
    }
  }
}
