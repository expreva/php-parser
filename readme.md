# PHP Parser

This is a standalone library to parse PHP in Node.js. It bundles a PHP runtime compiled to WebAssembly, so it doesn't depend on PHP being installed on the local system.

## Usage

```js
import { createPhp } from '@tangible/php-parser'

await php = await createPhp()

const code = `<?php echo 'hi';`

const {
  parsed, // Node[]
  error   // Error
} = await php.parse(code)

console.log(parsed)
```

#### Known limitations

After using the PHP runtime instance, it is necessary to exit the process when done.

```js
// Exit to stop PHP process
process.exit()
```

## Abstract Syntax Tree

See https://github.com/nikic/PHP-Parser/blob/master/doc/component/JSON_representation.markdown

## Included libraries

- [PHP WebAssembly](https://github.com/WordPress/wordpress-playground/tree/trunk/packages/php-wasm/node)

- [PHP-Parser in PHP](https://github.com/nikic/PHP-Parser)
