#!/user/bin/env node

const colors = require('colors'),
    traverse = require('@babel/traverse').default,
    parse = require('@babel/parser').parse,
    generate = require('@babel/generator').default,
    types = require('@babel/types'),
    path = require('path'),
    fs = require('fs'),
    beautify = require('js-beautify')

// const filePath = path.resolve(process.argv[2]),
//     outputFilePath = filePath.replace('.js', '-unmask.js'),
//     beginTime = Date.now()

//     if (!fs.existsSync(filePath)) {
//     console.log('File does not exist'.red)
//     return
// }

// console.log('Loading files and parsing ast...'.magenta)
// const source = fs.readFileSync(filePath, 'utf8'),
//     ast = parse(source)
    
// console.log('Finding variable mask arrays...'.cyan)

// https://stackoverflow.com/a/175787
function isNumeric(str) {
    if (typeof str != "string") return false // we only process strings!  
    return !isNaN(str)
    // return !isNaN(str) && // use type coercion to parse the _entirety_ of the string (`parseFloat` alone does not do this)...
    //        !isNaN(parseFloat(str)) // ...and ensure strings of whitespace fail
  }

function getMaskHolders(ast, removeRedundant) {
    let maskHolders = {},
        constantMasks = {}

    // TODO: make this identify mask holders by if they equal [arguments], like the docs on jscrambler show
    traverse(ast, {
        VariableDeclarator(path) {
            const node = path.node
            if (!types.isStringLiteral(node.init) && !types.isNumericLiteral(node.init))
                return

            if (types.isStringLiteral(node.init) && !isNumeric(node.init.value))
                return
            
            // if (node.id.name in constantMasks)
            //     console.log(node.id.name)
            constantMasks[node.id.name] = parseInt(node.init.value)
            if (removeRedundant) path.remove()
        },
        AssignmentExpression(path) {
            const node = path.node

            // this will only work properly if the variable is not used before setting it to a new one (see o8V in sample)
            if (types.isIdentifier(node.left) && node.left.name in constantMasks && (types.isNumericLiteral(node.right) || 
                (types.isStringLiteral(node.right) && isNumeric(node.right.value)))) {
                constantMasks[node.left.name] = node.right.value
                if (removeRedundant) path.remove()
            }
            
            if (!types.isMemberExpression(node.left) || !types.isIdentifier(node.left.object) ||
                !(types.isNumericLiteral(node.right) || types.isStringLiteral(node.right)))
                return

                c = false
            if (types.isIdentifier(node.left.property)) {
                c = true
                if (node.left.property.name in constantMasks)
                    node.left.property = types.valueToNode(constantMasks[node.left.property.name])
            } else if (!types.isNumericLiteral(node.left.property))
                return
            
            const name = node.left.object.name,
                index = node.left.property.value
            if (!maskHolders[name])
                maskHolders[name] = {}
                //if (c) console.log(name, index)
            //if (maskHolders[name][index])
            // if (types.isStringLiteral(node.right))
            {
                if (node.operator == '=') {
                    maskHolders[name][index] = node.right.value
                    path.node.right = types.valueToNode(node.right.value)
                }
                else if (node.operator == '+=') {
                    maskHolders[name][index] += node.right.value
                    path.node.right = types.valueToNode(maskHolders[name][index])
                    if (removeRedundant) path.node.operator = '='
                }
                // else
                //     console.log(name, index, node.operator) 
            }
            
            // let prev = path.getPrevSibling()
            // console.log(prev.type)
            // path.stop()
            // return

            // if (types.isAssignmentExpression(prev) && types.isMemberExpression(prev.left) && 
            //     prev.left.object.name == name && (
            // 	(types.isIdentifier(prev.left.property) && prev.left.property.name == index) || 
            // 	(types.isNumericLiteral(prev.left.property) && prev.left.property.value == index))) {
            //         prev.remove()
            //     }

            //path.remove()
            //maskHolders[name].push({index: node.left.property.value, value: node.right.value})
        }
    })
    return { maskHolders, constantMasks }
}

function unmask(ast, maskHolders, constantMasks, removeRedundant) {
    traverse(ast, {
        MemberExpression(path) {
            const node = path.node,
                prev = path.getStatementParent()
            
            if (types.isIdentifier(node.object) && maskHolders[node.object.name]) {
                const expression = prev.node.expression
                
                let keyName,
                    constant = false
                    
                if (types.isIdentifier(node.property)) {
                    //path.replaceWith(types.valueToNode(maskValues[node.object.name][node.property.name]))
                    keyName = node.property.name
                    constant = true
                }
                else if (types.isNumericLiteral(node.property))
                    //path.replaceWith(types.valueToNode(maskValues[node.object.name][node.property.value]))
                    keyName = node.property.value.toString()
                
                if (!constant) {
                    let valKeys = Object.keys(maskHolders[node.object.name])
                    if (!valKeys.includes(keyName))
                        return 
                } else if (!(keyName in constantMasks))
                    return
                    
                // resolve cases like d0p[E5f] to d0p[928]
                if (constant)
                {
                    if (types.isAssignmentExpression(expression) && types.isMemberExpression(expression.left) && 
                        maskHolders[expression.left.object.name] && types.isIdentifier(expression.left.property)) {
                            //console.log(keyName)
                            expression.left.property = types.valueToNode(constantMasks[keyName])
                            return
                    }

                    //if ()
                } 
                                
                if (types.isAssignmentExpression(expression) && types.isMemberExpression(expression.left) && 
                    maskHolders[expression.left.object.name] && (
                    (types.isIdentifier(expression.left.property) && expression.left.property.name == keyName) || 
                    (types.isNumericLiteral(expression.left.property) && expression.left.property.value == keyName))) {
                        if (removeRedundant) prev.remove() // remove redudant expressions, only use on subsequent unmasks
                        //console.log(expression.left.object.name, keyName)
                        return
                }
                else if (types.isUpdateExpression(expression) && types.isMemberExpression(expression.argument) &&
                    maskHolders[expression.argument.object.name] && (
                    (types.isIdentifier(expression.argument.property) && expression.argument.property.name == keyName) || 
                    (types.isNumericLiteral(expression.argument.property) && expression.argument.property.value == keyName))) {
                        return
                }

                path.replaceWith(types.valueToNode(maskHolders[node.object.name][keyName]))
            }
        }
    })
}

module.exports = {
    getMaskHolders,
    unmask
}

// console.log('Unmasking...'.cyan)

// // TODO: O0p[0][0] -> arguments[0] 
// //                O0p is [arguments], when index 0 is not set in maskHolders just set any reference to O0p[0] to arguments
// //                maybe resolve arguments to ones specified in function
// //                e.g. function a(s) { b = [arguments]; c = b[0][0]; d = b[0][1] } -> c = s /* arguments[0] */; d = arguments[1]


// console.log(maskHolders)

// console.log(`Finished routines! Total time taken: ${Date.now() - beginTime}ms`.brightYellow)

// let code = generate(ast, {}, source).code

// console.log('Saving cleaned file...'.magenta)
// fs.writeFileSync(outputFilePath, code)
// console.log('Done! Happy reversing :)'.magenta)