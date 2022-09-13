# ticket2
### This tool is deprecated. 

Tries to deobfuscate Supreme's ticket anti-bot. ticket uses JScrambler on a high security profile.

The tools in this repo attempt to handle converting control flow states to a format [pinyugi's tool](https://github.com/pinyugi/pooky) can handle, string unconcealing, unmasking variables, cleanup.\
A modified version of pinyugi's tool handles unflattening the control flow, unmasking / decoding xor'd evals, and other various things.

Routine should be: convert states, control flow unflattening, decode evals, string unconcealing, repeat unmasking variables until readable.
