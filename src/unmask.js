#!/user/bin/env node

const colors = require('colors'),
    traverse = require('@babel/traverse').default,
    parse = require('@babel/parser').parse,
    generate = require('@babel/generator').default,
    types = require('@babel/types'),
    path = require('path'),
    fs = require('fs'),
    beautify = require('js-beautify')

const filePath = path.resolve(process.argv[2]),
    outputFilePath = filePath.replace('.js', '-unmask.js'),
    beginTime = Date.now()

    if (!fs.existsSync(filePath)) {
    console.log('File does not exist'.red)
    return
}

console.log('Loading files and parsing ast...'.magenta)
const source = fs.readFileSync(filePath, 'utf8'),
    ast = parse(source)
    
console.log('Finding variable mask arrays...'.cyan)
let maskHolders = {}

traverse(ast, {
    AssignmentExpression(path) {
        const node = path.node
        
        if (!types.isMemberExpression(node.left) ||
            !types.isIdentifier(node.left.object) || !types.isNumericLiteral(node.left.property) ||
            !(types.isNumericLiteral(node.right) || types.isStringLiteral(node.right)))
            return
        
        const name = node.left.object.name,
            index = node.left.property.value
        if (!maskHolders[name])
            maskHolders[name] = {}
            
        //if (maskHolders[name][index])
        if (node.operator == '=')
            maskHolders[name][index] = node.right.value
        else if (node.operator == '+=')
            maskHolders[name][index] += node.right.value
        else
            console.log(name, index, node.operator)
        
        //path.remove()
        //maskHolders[name].push({index: node.left.property.value, value: node.right.value})
    }
})

console.log('Unmasking...'.cyan)
traverse(ast, {
	MemberExpression(path) {
		const node = path.node,
			prev = path.getStatementParent()
		
		if (types.isIdentifier(node.object) && maskHolders[node.object.name]) {
			const expression = prev.node.expression
			
			let valKeys = Object.keys(maskHolders[node.object.name]),
				keyName
				
			if (types.isIdentifier(node.property))
				//path.replaceWith(types.valueToNode(maskValues[node.object.name][node.property.name]))
				keyName = node.property.name
			else if (types.isNumericLiteral(node.property))
				//path.replaceWith(types.valueToNode(maskValues[node.object.name][node.property.value]))
				keyName = node.property.value.toString()
			
			if (!valKeys.includes(keyName))
				return
				
			//console.log(keyName)
			
			if (types.isAssignmentExpression(expression) && types.isMemberExpression(expression.left) && 
				maskHolders[expression.left.object.name] && (
				(types.isIdentifier(expression.left.property) && expression.left.property.name == keyName) || 
				(types.isNumericLiteral(expression.left.property) && expression.left.property.value == keyName))) {
					prev.remove()
					return
				}
            
			path.replaceWith(types.valueToNode(maskHolders[node.object.name][keyName]))
		}
	}
})

console.log(`Finished routines! Total time taken: ${Date.now() - beginTime}ms`.brightYellow)

let code = generate(ast, {}, source).code

console.log('Saving cleaned file...'.magenta)
fs.writeFileSync(outputFilePath, code)
console.log('Done! Happy reversing :)'.magenta)