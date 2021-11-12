import re

with open('a.txt') as f:
    lines = f.readlines()
    with open('ticket.js.cleaned.js', encoding='utf8') as tf:
        t = tf.read()
        for l in lines:
            l = l.strip()
            a = re.search("case [\w|\d]+\.[\w|\d]+\(\)" + l.replace('[', '\\[').replace(']', '\\]'), t)
            if a:
                print(l)
                break