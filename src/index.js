#!/user/bin/env node

const { utils, Flow } = require('./flow'),
    colors = require('colors'),
    traverse = require('@babel/traverse').default,
    parse = require('@babel/parser').parse,
    generate = require('@babel/generator').default,
    path = require('path'),
    fs = require('fs')
    beautify = require('js-beautify')

const filePath = path.resolve(process.argv[2]),
    outputFilePath = filePath + '.cleaned.js',
    beginTime = Date.now()

if (!fs.existsSync(filePath)) {
    console.log('File does not exist'.red)
    return
}

console.log('Loading files and parsing ast...'.magenta)
const source = fs.readFileSync(filePath, 'utf8'),
    ast = parse(source)


// Routines in order:
// Control Flow Un-flattening - Modify pinyugi's project to fix up opaque predicate ctrl flow (search for b4ssss in samples/ticket.js)
// String De-concealing - We have this after flow because of the shifting done on the
//                        decoded string array. It is easier to follow the order of
//                        the shifts when control flow is restored
// Variable Un-masking - https://docs.jscrambler.com/code-integrity/documentation/transformations/variable-masking
// Beautify - Recover indentation
console.log('Unescaping hexadecimal & unicode strings...'.cyan)
traverse(ast, {
    StringLiteral(path) {
        delete path.node.extra.raw
    }
})

console.log('Beautifying...'.cyan)
let code = generate(ast, {}, source).code
//code = beautify(code, {indent_size: 2, space_in_empty_paren: true})

console.log(`Finished routines! Total time taken: ${Date.now() - beginTime}ms`.brightYellow)

console.log('Saving cleaned file...'.magenta)
fs.writeFileSync(outputFilePath, code)
console.log('Done! Happy reversing :)'.magenta)