# PHP Parser

This is a standalone library to parse PHP in Node.js. It bundles a PHP runtime compiled to WebAssembly, so it doesn't depend on PHP being installed on the local system.

## Install

```sh
npm install @expreva/php-parser
```

## Usage

```js
import { createPhp } from '@expreva/php-parser'

await php = await createPhp()

const code = `<?php echo 'hi';`

const {
  parsed, // Node[]
  error   // Error
} = await php.parse(code)

console.log(parsed)
```

## Abstract Syntax Tree

See https://github.com/nikic/PHP-Parser/blob/master/doc/component/JSON_representation.markdown

## Included libraries

- [PHP-WASM](https://github.com/WordPress/wordpress-playground/tree/trunk/packages/php-wasm/node)
- [PHP-Parser](https://github.com/nikic/PHP-Parser)
