<?php

spl_autoload_register(function($class_name) {
  $prefix = 'PhpParser\\';
  if ( ! str_starts_with( $class_name, $prefix ) ) return;
  $class_path = str_replace('\\', DIRECTORY_SEPARATOR,
    str_replace($prefix, '', $class_name)
  ) . '.php';
  include_once __DIR__ . '/lib/' . $class_path;
});

use PhpParser\ParserFactory;

function parse_php($code) {
  static $parser;
  if (!$parser) $parser = (new ParserFactory())->createForHostVersion();

  try {
    return [
      'parsed' => $parser->parse($code) // JSON serializable
    ];
  } catch (PhpParser\Error $e) {
    return [
      'error' => $e->getMessage(),
      // https://github.com/nikic/PHP-Parser/blob/master/doc/component/Error_handling.markdown
      'position' => [
        'startLine' => $e->getStartLine(),
        'startColumn' => $e->getStartColumn(),
        'endLine' => $e->getEndLine(),
        'endColumn' => $e->getEndColumn(),
      ],
    ];
  }
}

function create_php_nodes($json) {
  static $decoder;
  if (!$decoder) $decoder = new PhpParser\JsonDecoder();
  return $decoder->decode($json); // $nodes
}

function render_php($nodes) {
  // https://github.com/nikic/PHP-Parser/blob/master/doc/component/Pretty_printing.markdown  
  static $printer;
  if (!$printer) $printer = new PhpParser\PrettyPrinter\Standard;
  return $printer->prettyPrintFile($nodes);
}
