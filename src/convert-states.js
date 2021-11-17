#!/user/bin/env node

const colors = require('colors'),
    traverse = require('@babel/traverse').default,
    parse = require('@babel/parser').parse,
    generate = require('@babel/generator').default,
    types = require('@babel/types'),
    path = require('path'),
    fs = require('fs'),
    beautify = require('js-beautify'),
    generateFlowArray = require('./statefunc')
    
const filePath = path.resolve(process.argv[2]),
    outputFilePath = filePath.replace('.js', '-convert.js'),
    beginTime = Date.now()

    if (!fs.existsSync(filePath)) {
    console.log('File does not exist'.red)
    return
}

console.log('Loading files and parsing ast...'.magenta)
const source = fs.readFileSync(filePath, 'utf8'),
    ast = parse(source)

// too lazy to make this dynamic
const size = 826,
    skip = 6,
    m7m = [14, 826]
    
console.log('Generating flow array...'.cyan)
let flowArray = generateFlowArray(size, skip, m7m)

console.log('Converting MemberExpression states to Integer states...'.cyan)
//console.log('Grabbing switch case tests...'.cyan)
let end,
    endIndex = 69739420 // random number

traverse(ast, {
    ForStatement(path)
    { //return
        let node = path.node,
            prev = path.getPrevSibling(),
            stateHolder,
            stateHolderName,
            initialState,
            cases = {}
        if (!(types.isVariableDeclaration(prev) && prev.node.declarations.length > 0 && prev.node.declarations.length === 1)) {
            if (types.isExpressionStatement(prev) && types.isAssignmentExpression(prev.node.expression) && types.isMemberExpression(prev.node.expression.left) &&
                types.isMemberExpression(prev.node.expression.right)) {

                //initialState = generate(prev.node.expression.right).code
                //let prev2 = prev.getPrevSibling()
                //prev.remove()
                //prev = prev2
                //if (!types.isVariableDeclaration(prev))
                //    return

                //stateHolder = prev.node.declarations[0]
                stateHolderName = prev.node.expression.left.object.name
                let index = prev.node.expression.left.property.value
                prev.replaceWith(types.variableDeclaration("var", [types.variableDeclarator(types.identifier(`${stateHolderName}_${index}`), prev.node.expression.right)]))
                stateHolder = prev.node.declarations[0]
            }
        }
        else {
            stateHolder = prev.node.declarations[0]
            stateHolderName = stateHolder.id.name
            if (!types.isMemberExpression(stateHolder.init) || !types.isIdentifier(stateHolder.id))
                return
            //initialState = generate(stateHolder.init).code
        }

        initialState = generate(stateHolder.init).code

        if (node.init != null || node.update != null || node.test == null ||
            !types.isMemberExpression(node.test.right) || node.body == null || node.body.body.length > 1 ||
            !types.isSwitchStatement(node.body.body[0]))
            return

        if (types.isMemberExpression(node.test.left)) {
            if (node.test.left.object.name !== stateHolderName)
                return

            // convert O0P[1] !== to O0P !==
            let n = types.identifier(stateHolder.id.name) // stateHolderName
            node.test.left = n
            node.body.body[0].discriminant = n
        }

        initialState = initialState.substring(initialState.indexOf('['))

        end = generate(node.test.right).code
        end = end.substring(end.indexOf('['))
        node.test.right = types.numericLiteral(endIndex) // replace ending with endIndex

        for (let [i, c] of node.body.body[0].cases.entries()) {
            let cons = c.consequent
            if (types.isBreakStatement(cons[cons.length - 1])) {
                let assignment //
                if (types.isExpressionStatement(cons[cons.length - 2]))
                    assignment = cons[cons.length - 2].expression

                if (assignment !== undefined) {
                    if (!types.isAssignmentExpression(assignment))
                        return

                    if (types.isMemberExpression(assignment.left))
                        assignment.left = types.identifier(stateHolder.id.name) // stateHolderName | convert O0P[1] = 50 to O0P = 50
                    else if (!types.isIdentifier(assignment.left))
                        return

                    if (types.isNumericLiteral(assignment.right)) // i have only seen these as dead code
                    {
                        //console.log(stateHolderName)
                        //assignment.right.value = 0;
                        delete node.body.body[0].cases[i]
                        continue
                    }
                }

                if (!cases[stateHolderName])
                    cases[stateHolderName] = []
                let index = cases[stateHolderName].length
                let caseCode = generate(c.test).code
                caseCode = caseCode.substring(caseCode.indexOf('['))

                cases[stateHolderName][index] = { assignmentNode: assignment, caseCode: caseCode }
                c.test = types.numericLiteral(index + 1)  // start at 1 so pinyugi tool works

                if (eval(`flowArray${initialState} == flowArray${caseCode}`))
                    stateHolder.init = types.numericLiteral(index + 1)
            }
        }

        for (let stateHolderName of Object.keys(cases))
        {
            const list = cases[stateHolderName]

            for (let obj of list) {
                let node = obj.assignmentNode
                // let node = path.node,
                //     stateHolderName

                if (node === undefined)
                    continue;

                if (types.isMemberExpression(node.right)) {
                    let s = generate(node.right).code
                    s = s.substring(s.indexOf('['))

                    if (eval(`flowArray${end} == flowArray${s}`))
                        node.right = types.numericLiteral(endIndex)
                    else {
                        for (let i = 0; i < cases[stateHolderName].length; i++) {
                            let c = cases[stateHolderName][i].caseCode

                            if (eval(`flowArray${c} == flowArray${s}`)) {
                                node.right = types.numericLiteral(i + 1)
                                break
                            }
                        }
                    }
                }
                else if (types.isConditionalExpression(node.right)) {
                    let cons = generate(node.right.consequent).code,
                        alt = generate(node.right.alternate).code

                    cons = cons.substring(cons.indexOf('['))
                    alt = alt.substring(alt.indexOf('['))

                    let consSet = false, // lol
                        altSet = false

                    if (eval(`flowArray${end} == flowArray${cons}`)) {
                        node.right.consequent = types.numericLiteral(endIndex)
                        consSet = true
                    }

                    if (eval(`flowArray${end} == flowArray${alt}`)) {
                        node.right.alternate = types.numericLiteral(endIndex)
                        altSet = true
                    }

                    for (let i = 0; i < cases[stateHolderName].length; i++) {
                        if (consSet && altSet)
                            break

                        let c = cases[stateHolderName][i].caseCode
                        // if (stateHolder.id.name === 'H7o_1')
                        //     console.log(altSet, alt, c, eval(`flowArray${c} == flowArray${alt}`))
                        if (!consSet && eval(`flowArray${c} == flowArray${cons}`)) {
                            node.right.consequent = types.numericLiteral(i + 1)
                            consSet = true
                        }
                        if (!altSet && eval(`flowArray${c} == flowArray${alt}`)) {
                            node.right.alternate = types.numericLiteral(i + 1)
                            altSet = true
                        }
                    }
                }
            }
        }
    }
})

// // TODO: Add this to beautifying routine in index.js
// console.log('Evaluating constants...'.cyan)
// traverse(ast, {
//     BinaryExpression(path) {
//         let code = generate(path.node).code
//         if (/[a-zA-Z]/.test(code))
//             return
        
//         let evaluated = eval(code)
//         if (evaluated != undefined)
//             path.replaceWith(types.valueToNode(evaluated))
//     },
//     UnaryExpression(path) {
//         if (types.isStringLiteral(path.node.argument)) {
//             if (path.node.operator === '+')
//                 path.replaceWith(types.NumericLiteral(parseInt(path.node.argument.value)))
            
//         } else if (types.isUnaryExpression(path.node.argument)) {
//             if (path.node.operator === '-' && path.node.argument.operator === '+') {
//                 path.replaceWith(types.NumericLiteral(-parseInt(path.node.argument.argument.value)))
//             }
//         }

//     }
// })

console.log(`Finished routines! Total time taken: ${Date.now() - beginTime}ms`.brightYellow)

let code = generate(ast, {}, source).code

console.log('Saving cleaned file...'.magenta)
fs.writeFileSync(outputFilePath, code)
console.log('Done! Happy reversing :)'.magenta)