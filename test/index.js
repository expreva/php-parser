import fs from 'node:fs/promises'
import { inspect } from 'util'
import path, { dirname } from 'path'
import { fileURLToPath } from 'url'
import { createPhp } from '../index.js'

const __dirname = dirname(fileURLToPath(import.meta.url))

;(async () => {
  const php = await createPhp()

  const { parsed, error, invalidResult } = await php.parse(
    await fs.readFile(path.join(__dirname, 'example.php'), 'utf8')
  )

  if (error) {
    console.log(error || parsed)
    if (invalidResult) console.log(invalidResult)
  } else {
    // console.log(parsed)

    function walk(nodes, callback) {
      for (const node of nodes) {
        callback(node)
        if (node.stmts) {
          walk(node.stmts, callback)
        }
      }
    }

    const comments = []

    walk(parsed, (node) => {
      if (node?.attributes?.comments) {
        const [comment] = node?.attributes?.comments
        const {
          nodeType: commentType, // Comment or Comment_Doc
          text,
        } = comment

        if (commentType !== 'Comment_Doc') return

        // console.log('Node', inspect(node, {
        //   colors: true
        // }))

        switch (node.nodeType) {
          case 'Stmt_Function':
            if (node.name && node.name.nodeType === 'Identifier') {
              console.log('Function:', node.name.name)
              console.log(text)
            }
            break
          case 'Stmt_ClassMethod':
            if (node.name && node.name.nodeType === 'Identifier') {
              console.log('Class method:', node.name.name)
              console.log(text)
            }
            break
          case 'Stmt_Expression':
            if (node.expr && node.expr.nodeType === 'Expr_Assign') {
              // $var->method = function() {};

              if (
                node.expr.var &&
                node.expr.var.name &&
                node.expr.var.name.nodeType === 'Identifier'
              ) {
                console.log('Statement Function:', node.expr.var.name.name)
                console.log(text)
              } else {
                // console.log('Statement', node.expr.var)
                // console.log(node.expr.expr)
              }
            }
            break
          case 'Stmt_Nop': // No operation
          default:
            break
        }

        console.log()
      }
    })
  }

  // Exit to stop PHP process
  process.exit()
})().catch(console.error)
