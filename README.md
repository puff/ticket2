# ticket2
### This tool is deprecated. 

Tries to deobfuscate Supreme's ticket anti-bot. ticket uses JScrambler on a high security profile.

The tools in this repo attempt to handle converting control flow states to a format [pinyugi's tool](https://github.com/pinyugi/pooky) can handle, string unconcealing, unmasking variables, cleanup.\
A modified version of pinyugi's tool handles unflattening the control flow, unmasking / decoding xor'd evals, and other various things.

Routines in order:
* Decode / unmask evals
* Convert flow state format for use in pinyugi's tool
* Control Flow Unflattening
  * https://docs.jscrambler.com/code-integrity/tutorials/control-flow-flattening
* Variable Unmasking
  * https://docs.jscrambler.com/code-integrity/documentation/transformations/variable-masking
* String Unconcealing 
  * https://docs.jscrambler.com/code-integrity/documentation/transformations/string-concealing
  * We have this after flow because of the shifting done on the decoded string array. It is easier to follow the order of the shifts when control flow is restored
* Variable Unmasking
  * This may need to be done multiple times to make the code readable.
* String joining (TODO)
  * https://docs.jscrambler.com/code-integrity/documentation/transformations/string-splitting
* Beautify - Recover indentation and unescape hexadecimal & unicode encoded strings

A possible issue with restoring control flow first could result in the shift
function being improperly unflattened, or breaking the flow in a
way that breaks our code. It may be worth it to just follow the flow
of the shift function in the string unconcealing routine.
