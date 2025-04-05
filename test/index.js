import fs from 'node:fs/promises'
import { inspect } from 'util'
import path, { dirname } from 'path'
import { fileURLToPath } from 'url'
import { test, is, ok, run } from 'testra'
import { createPhp } from '../index.js'

const __dirname = dirname(fileURLToPath(import.meta.url))

function parseComment(text) {
  const cleanText = text
    .replace(/\n[ \t]+\*/g, '\n *') // Normalize indent before " * "
    .replace(/\/\*\*[ \t]?/g, '') // Starting "/**"
    .replace(/\n[ \t]+\*\//g, '') // Ending "*/"
    .replace(/\n[ \t]+\*[ \t]?/g, '\n') // Line " * "
    .trim()
    .split('\n')
  return cleanText
}

function walk(nodes, callback) {
  for (const node of nodes) {
    callback(node, (childNodes) => walk(childNodes, callback))
    if (node.stmts) {
      walk(node.stmts, (childNode, fn) => {
        childNode.parent = node
        callback(childNode, fn)
      })
    }
  }
}

function extractCommentBlocks(nodes) {
  const parsedComments = []

  walk(nodes, (node, childWalk) => {
    if (!node?.attributes?.comments) return

    const [comment] = node?.attributes?.comments
    const {
      nodeType: commentType, // Comment or Comment_Doc
    } = comment

    if (commentType !== 'Comment_Doc') {
      // Ignore single-line comments
      // console.log(commentType, node)
      return
    }

    const parsedComment = parseComment(comment.text)

    // console.log('Node', inspect(node, {
    //   colors: true
    // }))

    switch (node.nodeType) {
      case 'Stmt_Function':
        if (node.name && node.name.nodeType === 'Identifier') {
          const functionName = node.name.name

          // console.log(`Function ${node.name.name}`)
          // console.log(parsedComment)

          parsedComments.push({
            type: 'function',
            name: functionName,
            parsedComment,
          })
        }
        break
      case 'Stmt_Class':
        if (node.name && node.name.nodeType === 'Identifier') {
          const className = node.name.name

          // console.log(`Class ${node.name.name}`) // TODO: Extends
          // console.log(parsedComment)

          parsedComments.push({
            type: 'class',
            name: className,
            parsedComment,
          })
        }
        break
      case 'Stmt_ClassMethod':
        if (node.name && node.name.nodeType === 'Identifier') {
          const method = node.name.name
          const className = node.parent ? node.parent.name.name : ''

          // console.log(`Class method ${className}::${method}`)
          // console.log(parsedComment)

          parsedComments.push({
            type: 'classMethod',
            name: method,
            className,
            parsedComment,
          })
        }
        break
      case 'Stmt_Expression':
        if (node.expr && node.expr.nodeType === 'Expr_Assign') {
          // $var->method = function() {};
          if (
            // Function being assigned
            node.expr.var &&
            node.expr.var.name &&
            node.expr.var.name.nodeType === 'Identifier' &&
            // Target variable name
            node.expr.var.var &&
            node.expr.var.var.nodeType === 'Expr_Variable'
          ) {
            const method = node.expr.var.name.name
            const varName = node.expr.var.var.name

            // console.log('Dynamic method', `$${varName}->${method}`)
            // console.log(parsedComment)
            // console.log(node.expr)

            parsedComments.push({
              type: 'dynamicMethod',
              name: method,
              varName,
              parsedComment,
            })
          } else {
            // console.log('Statement', node.expr.var)
            // console.log(node.expr.expr)
          }
        }
        break
      case 'Stmt_Nop': // No operation - Free standing comment
        break
      default:
        console.log('Unknown node type', node.nodeType)
        console.log(node)
        break
    }

    // console.log()
  })

  return parsedComments
}

run(async () => {
  test('PHP', async () => {
    const php = await createPhp()

    const { parsed, error, invalidResult } = await php.parse(
      await fs.readFile(path.join(__dirname, 'example.php'), 'utf8')
    )

    if (error) {
      console.log(error || parsed)
      if (invalidResult) console.log(invalidResult)

      ok(false, 'php.parse()')
      return
    }

    ok(true, 'php.parse()')
    is(true, Array.isArray(parsed), 'php.parse() returns parsed nodes')

    // console.log(parsed)

    const commentBlocks = extractCommentBlocks(parsed)
    const expectedCommentTypes = [
      {
        title: 'Function printLine',
        type: 'function',
        name: 'printLine',
      },
      {
        title: 'Class Test',
        type: 'class',
        name: 'Test',
      },
      {
        title: 'Class method Test::method',
        type: 'classMethod',
        name: 'method',
        className: 'Test',
      },
      {
        title: 'Dynamic method $test->function_name',
        type: 'dynamicMethod',
        name: 'function_name',
        varName: 'test',
      },
    ]

    for (const expected of expectedCommentTypes) {
      const checkKeys = Object.keys(expected).filter((key) => key !== 'title')
      const testKey = expected.title || `${Object.values(expected).join(' ')}`

      let matched
      for (const block of commentBlocks) {
        let allMatched = true
        for (const key of checkKeys) {
          if (block[key] !== expected[key]) {
            allMatched = false
            break
          }
        }
        if (allMatched) {
          matched = block
          break
        } else {
          // console.log('Nope', JSON.stringify(block))
        }
      }

      ok(matched, testKey)
    }
  })
})
