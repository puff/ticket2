#!/user/bin/env node

const colors = require('colors'),
    traverse = require('@babel/traverse').default,
    parse = require('@babel/parser').parse,
    generate = require('@babel/generator').default,
    types = require('@babel/types'),
    path = require('path'),
    fs = require('fs'),
    beautify = require('js-beautify'),
    maskFunctions = require('./unmask')

const filePath = path.resolve(process.argv[2]),
    outputFilePath = filePath.replace('.js', '-cleaned.js'),
    beginTime = Date.now(),
    validIdentifierRegex = /^(?!(?:do|if|in|for|let|new|try|var|case|else|enum|eval|false|null|this|true|void|with|break|catch|class|const|super|throw|while|yield|delete|export|import|public|return|static|switch|typeof|default|extends|finally|package|private|continue|debugger|function|arguments|interface|protected|implements|instanceof)$)[$A-Z\_a-z\xaa\xb5\xba\xc0-\xd6\xd8-\xf6\xf8-\u02c1\u02c6-\u02d1\u02e0-\u02e4\u02ec\u02ee\u0370-\u0374\u0376\u0377\u037a-\u037d\u0386\u0388-\u038a\u038c\u038e-\u03a1\u03a3-\u03f5\u03f7-\u0481\u048a-\u0527\u0531-\u0556\u0559\u0561-\u0587\u05d0-\u05ea\u05f0-\u05f2\u0620-\u064a\u066e\u066f\u0671-\u06d3\u06d5\u06e5\u06e6\u06ee\u06ef\u06fa-\u06fc\u06ff\u0710\u0712-\u072f\u074d-\u07a5\u07b1\u07ca-\u07ea\u07f4\u07f5\u07fa\u0800-\u0815\u081a\u0824\u0828\u0840-\u0858\u08a0\u08a2-\u08ac\u0904-\u0939\u093d\u0950\u0958-\u0961\u0971-\u0977\u0979-\u097f\u0985-\u098c\u098f\u0990\u0993-\u09a8\u09aa-\u09b0\u09b2\u09b6-\u09b9\u09bd\u09ce\u09dc\u09dd\u09df-\u09e1\u09f0\u09f1\u0a05-\u0a0a\u0a0f\u0a10\u0a13-\u0a28\u0a2a-\u0a30\u0a32\u0a33\u0a35\u0a36\u0a38\u0a39\u0a59-\u0a5c\u0a5e\u0a72-\u0a74\u0a85-\u0a8d\u0a8f-\u0a91\u0a93-\u0aa8\u0aaa-\u0ab0\u0ab2\u0ab3\u0ab5-\u0ab9\u0abd\u0ad0\u0ae0\u0ae1\u0b05-\u0b0c\u0b0f\u0b10\u0b13-\u0b28\u0b2a-\u0b30\u0b32\u0b33\u0b35-\u0b39\u0b3d\u0b5c\u0b5d\u0b5f-\u0b61\u0b71\u0b83\u0b85-\u0b8a\u0b8e-\u0b90\u0b92-\u0b95\u0b99\u0b9a\u0b9c\u0b9e\u0b9f\u0ba3\u0ba4\u0ba8-\u0baa\u0bae-\u0bb9\u0bd0\u0c05-\u0c0c\u0c0e-\u0c10\u0c12-\u0c28\u0c2a-\u0c33\u0c35-\u0c39\u0c3d\u0c58\u0c59\u0c60\u0c61\u0c85-\u0c8c\u0c8e-\u0c90\u0c92-\u0ca8\u0caa-\u0cb3\u0cb5-\u0cb9\u0cbd\u0cde\u0ce0\u0ce1\u0cf1\u0cf2\u0d05-\u0d0c\u0d0e-\u0d10\u0d12-\u0d3a\u0d3d\u0d4e\u0d60\u0d61\u0d7a-\u0d7f\u0d85-\u0d96\u0d9a-\u0db1\u0db3-\u0dbb\u0dbd\u0dc0-\u0dc6\u0e01-\u0e30\u0e32\u0e33\u0e40-\u0e46\u0e81\u0e82\u0e84\u0e87\u0e88\u0e8a\u0e8d\u0e94-\u0e97\u0e99-\u0e9f\u0ea1-\u0ea3\u0ea5\u0ea7\u0eaa\u0eab\u0ead-\u0eb0\u0eb2\u0eb3\u0ebd\u0ec0-\u0ec4\u0ec6\u0edc-\u0edf\u0f00\u0f40-\u0f47\u0f49-\u0f6c\u0f88-\u0f8c\u1000-\u102a\u103f\u1050-\u1055\u105a-\u105d\u1061\u1065\u1066\u106e-\u1070\u1075-\u1081\u108e\u10a0-\u10c5\u10c7\u10cd\u10d0-\u10fa\u10fc-\u1248\u124a-\u124d\u1250-\u1256\u1258\u125a-\u125d\u1260-\u1288\u128a-\u128d\u1290-\u12b0\u12b2-\u12b5\u12b8-\u12be\u12c0\u12c2-\u12c5\u12c8-\u12d6\u12d8-\u1310\u1312-\u1315\u1318-\u135a\u1380-\u138f\u13a0-\u13f4\u1401-\u166c\u166f-\u167f\u1681-\u169a\u16a0-\u16ea\u16ee-\u16f0\u1700-\u170c\u170e-\u1711\u1720-\u1731\u1740-\u1751\u1760-\u176c\u176e-\u1770\u1780-\u17b3\u17d7\u17dc\u1820-\u1877\u1880-\u18a8\u18aa\u18b0-\u18f5\u1900-\u191c\u1950-\u196d\u1970-\u1974\u1980-\u19ab\u19c1-\u19c7\u1a00-\u1a16\u1a20-\u1a54\u1aa7\u1b05-\u1b33\u1b45-\u1b4b\u1b83-\u1ba0\u1bae\u1baf\u1bba-\u1be5\u1c00-\u1c23\u1c4d-\u1c4f\u1c5a-\u1c7d\u1ce9-\u1cec\u1cee-\u1cf1\u1cf5\u1cf6\u1d00-\u1dbf\u1e00-\u1f15\u1f18-\u1f1d\u1f20-\u1f45\u1f48-\u1f4d\u1f50-\u1f57\u1f59\u1f5b\u1f5d\u1f5f-\u1f7d\u1f80-\u1fb4\u1fb6-\u1fbc\u1fbe\u1fc2-\u1fc4\u1fc6-\u1fcc\u1fd0-\u1fd3\u1fd6-\u1fdb\u1fe0-\u1fec\u1ff2-\u1ff4\u1ff6-\u1ffc\u2071\u207f\u2090-\u209c\u2102\u2107\u210a-\u2113\u2115\u2119-\u211d\u2124\u2126\u2128\u212a-\u212d\u212f-\u2139\u213c-\u213f\u2145-\u2149\u214e\u2160-\u2188\u2c00-\u2c2e\u2c30-\u2c5e\u2c60-\u2ce4\u2ceb-\u2cee\u2cf2\u2cf3\u2d00-\u2d25\u2d27\u2d2d\u2d30-\u2d67\u2d6f\u2d80-\u2d96\u2da0-\u2da6\u2da8-\u2dae\u2db0-\u2db6\u2db8-\u2dbe\u2dc0-\u2dc6\u2dc8-\u2dce\u2dd0-\u2dd6\u2dd8-\u2dde\u2e2f\u3005-\u3007\u3021-\u3029\u3031-\u3035\u3038-\u303c\u3041-\u3096\u309d-\u309f\u30a1-\u30fa\u30fc-\u30ff\u3105-\u312d\u3131-\u318e\u31a0-\u31ba\u31f0-\u31ff\u3400-\u4db5\u4e00-\u9fcc\ua000-\ua48c\ua4d0-\ua4fd\ua500-\ua60c\ua610-\ua61f\ua62a\ua62b\ua640-\ua66e\ua67f-\ua697\ua6a0-\ua6ef\ua717-\ua71f\ua722-\ua788\ua78b-\ua78e\ua790-\ua793\ua7a0-\ua7aa\ua7f8-\ua801\ua803-\ua805\ua807-\ua80a\ua80c-\ua822\ua840-\ua873\ua882-\ua8b3\ua8f2-\ua8f7\ua8fb\ua90a-\ua925\ua930-\ua946\ua960-\ua97c\ua984-\ua9b2\ua9cf\uaa00-\uaa28\uaa40-\uaa42\uaa44-\uaa4b\uaa60-\uaa76\uaa7a\uaa80-\uaaaf\uaab1\uaab5\uaab6\uaab9-\uaabd\uaac0\uaac2\uaadb-\uaadd\uaae0-\uaaea\uaaf2-\uaaf4\uab01-\uab06\uab09-\uab0e\uab11-\uab16\uab20-\uab26\uab28-\uab2e\uabc0-\uabe2\uac00-\ud7a3\ud7b0-\ud7c6\ud7cb-\ud7fb\uf900-\ufa6d\ufa70-\ufad9\ufb00-\ufb06\ufb13-\ufb17\ufb1d\ufb1f-\ufb28\ufb2a-\ufb36\ufb38-\ufb3c\ufb3e\ufb40\ufb41\ufb43\ufb44\ufb46-\ufbb1\ufbd3-\ufd3d\ufd50-\ufd8f\ufd92-\ufdc7\ufdf0-\ufdfb\ufe70-\ufe74\ufe76-\ufefc\uff21-\uff3a\uff41-\uff5a\uff66-\uffbe\uffc2-\uffc7\uffca-\uffcf\uffd2-\uffd7\uffda-\uffdc][$A-Z\_a-z\xaa\xb5\xba\xc0-\xd6\xd8-\xf6\xf8-\u02c1\u02c6-\u02d1\u02e0-\u02e4\u02ec\u02ee\u0370-\u0374\u0376\u0377\u037a-\u037d\u0386\u0388-\u038a\u038c\u038e-\u03a1\u03a3-\u03f5\u03f7-\u0481\u048a-\u0527\u0531-\u0556\u0559\u0561-\u0587\u05d0-\u05ea\u05f0-\u05f2\u0620-\u064a\u066e\u066f\u0671-\u06d3\u06d5\u06e5\u06e6\u06ee\u06ef\u06fa-\u06fc\u06ff\u0710\u0712-\u072f\u074d-\u07a5\u07b1\u07ca-\u07ea\u07f4\u07f5\u07fa\u0800-\u0815\u081a\u0824\u0828\u0840-\u0858\u08a0\u08a2-\u08ac\u0904-\u0939\u093d\u0950\u0958-\u0961\u0971-\u0977\u0979-\u097f\u0985-\u098c\u098f\u0990\u0993-\u09a8\u09aa-\u09b0\u09b2\u09b6-\u09b9\u09bd\u09ce\u09dc\u09dd\u09df-\u09e1\u09f0\u09f1\u0a05-\u0a0a\u0a0f\u0a10\u0a13-\u0a28\u0a2a-\u0a30\u0a32\u0a33\u0a35\u0a36\u0a38\u0a39\u0a59-\u0a5c\u0a5e\u0a72-\u0a74\u0a85-\u0a8d\u0a8f-\u0a91\u0a93-\u0aa8\u0aaa-\u0ab0\u0ab2\u0ab3\u0ab5-\u0ab9\u0abd\u0ad0\u0ae0\u0ae1\u0b05-\u0b0c\u0b0f\u0b10\u0b13-\u0b28\u0b2a-\u0b30\u0b32\u0b33\u0b35-\u0b39\u0b3d\u0b5c\u0b5d\u0b5f-\u0b61\u0b71\u0b83\u0b85-\u0b8a\u0b8e-\u0b90\u0b92-\u0b95\u0b99\u0b9a\u0b9c\u0b9e\u0b9f\u0ba3\u0ba4\u0ba8-\u0baa\u0bae-\u0bb9\u0bd0\u0c05-\u0c0c\u0c0e-\u0c10\u0c12-\u0c28\u0c2a-\u0c33\u0c35-\u0c39\u0c3d\u0c58\u0c59\u0c60\u0c61\u0c85-\u0c8c\u0c8e-\u0c90\u0c92-\u0ca8\u0caa-\u0cb3\u0cb5-\u0cb9\u0cbd\u0cde\u0ce0\u0ce1\u0cf1\u0cf2\u0d05-\u0d0c\u0d0e-\u0d10\u0d12-\u0d3a\u0d3d\u0d4e\u0d60\u0d61\u0d7a-\u0d7f\u0d85-\u0d96\u0d9a-\u0db1\u0db3-\u0dbb\u0dbd\u0dc0-\u0dc6\u0e01-\u0e30\u0e32\u0e33\u0e40-\u0e46\u0e81\u0e82\u0e84\u0e87\u0e88\u0e8a\u0e8d\u0e94-\u0e97\u0e99-\u0e9f\u0ea1-\u0ea3\u0ea5\u0ea7\u0eaa\u0eab\u0ead-\u0eb0\u0eb2\u0eb3\u0ebd\u0ec0-\u0ec4\u0ec6\u0edc-\u0edf\u0f00\u0f40-\u0f47\u0f49-\u0f6c\u0f88-\u0f8c\u1000-\u102a\u103f\u1050-\u1055\u105a-\u105d\u1061\u1065\u1066\u106e-\u1070\u1075-\u1081\u108e\u10a0-\u10c5\u10c7\u10cd\u10d0-\u10fa\u10fc-\u1248\u124a-\u124d\u1250-\u1256\u1258\u125a-\u125d\u1260-\u1288\u128a-\u128d\u1290-\u12b0\u12b2-\u12b5\u12b8-\u12be\u12c0\u12c2-\u12c5\u12c8-\u12d6\u12d8-\u1310\u1312-\u1315\u1318-\u135a\u1380-\u138f\u13a0-\u13f4\u1401-\u166c\u166f-\u167f\u1681-\u169a\u16a0-\u16ea\u16ee-\u16f0\u1700-\u170c\u170e-\u1711\u1720-\u1731\u1740-\u1751\u1760-\u176c\u176e-\u1770\u1780-\u17b3\u17d7\u17dc\u1820-\u1877\u1880-\u18a8\u18aa\u18b0-\u18f5\u1900-\u191c\u1950-\u196d\u1970-\u1974\u1980-\u19ab\u19c1-\u19c7\u1a00-\u1a16\u1a20-\u1a54\u1aa7\u1b05-\u1b33\u1b45-\u1b4b\u1b83-\u1ba0\u1bae\u1baf\u1bba-\u1be5\u1c00-\u1c23\u1c4d-\u1c4f\u1c5a-\u1c7d\u1ce9-\u1cec\u1cee-\u1cf1\u1cf5\u1cf6\u1d00-\u1dbf\u1e00-\u1f15\u1f18-\u1f1d\u1f20-\u1f45\u1f48-\u1f4d\u1f50-\u1f57\u1f59\u1f5b\u1f5d\u1f5f-\u1f7d\u1f80-\u1fb4\u1fb6-\u1fbc\u1fbe\u1fc2-\u1fc4\u1fc6-\u1fcc\u1fd0-\u1fd3\u1fd6-\u1fdb\u1fe0-\u1fec\u1ff2-\u1ff4\u1ff6-\u1ffc\u2071\u207f\u2090-\u209c\u2102\u2107\u210a-\u2113\u2115\u2119-\u211d\u2124\u2126\u2128\u212a-\u212d\u212f-\u2139\u213c-\u213f\u2145-\u2149\u214e\u2160-\u2188\u2c00-\u2c2e\u2c30-\u2c5e\u2c60-\u2ce4\u2ceb-\u2cee\u2cf2\u2cf3\u2d00-\u2d25\u2d27\u2d2d\u2d30-\u2d67\u2d6f\u2d80-\u2d96\u2da0-\u2da6\u2da8-\u2dae\u2db0-\u2db6\u2db8-\u2dbe\u2dc0-\u2dc6\u2dc8-\u2dce\u2dd0-\u2dd6\u2dd8-\u2dde\u2e2f\u3005-\u3007\u3021-\u3029\u3031-\u3035\u3038-\u303c\u3041-\u3096\u309d-\u309f\u30a1-\u30fa\u30fc-\u30ff\u3105-\u312d\u3131-\u318e\u31a0-\u31ba\u31f0-\u31ff\u3400-\u4db5\u4e00-\u9fcc\ua000-\ua48c\ua4d0-\ua4fd\ua500-\ua60c\ua610-\ua61f\ua62a\ua62b\ua640-\ua66e\ua67f-\ua697\ua6a0-\ua6ef\ua717-\ua71f\ua722-\ua788\ua78b-\ua78e\ua790-\ua793\ua7a0-\ua7aa\ua7f8-\ua801\ua803-\ua805\ua807-\ua80a\ua80c-\ua822\ua840-\ua873\ua882-\ua8b3\ua8f2-\ua8f7\ua8fb\ua90a-\ua925\ua930-\ua946\ua960-\ua97c\ua984-\ua9b2\ua9cf\uaa00-\uaa28\uaa40-\uaa42\uaa44-\uaa4b\uaa60-\uaa76\uaa7a\uaa80-\uaaaf\uaab1\uaab5\uaab6\uaab9-\uaabd\uaac0\uaac2\uaadb-\uaadd\uaae0-\uaaea\uaaf2-\uaaf4\uab01-\uab06\uab09-\uab0e\uab11-\uab16\uab20-\uab26\uab28-\uab2e\uabc0-\uabe2\uac00-\ud7a3\ud7b0-\ud7c6\ud7cb-\ud7fb\uf900-\ufa6d\ufa70-\ufad9\ufb00-\ufb06\ufb13-\ufb17\ufb1d\ufb1f-\ufb28\ufb2a-\ufb36\ufb38-\ufb3c\ufb3e\ufb40\ufb41\ufb43\ufb44\ufb46-\ufbb1\ufbd3-\ufd3d\ufd50-\ufd8f\ufd92-\ufdc7\ufdf0-\ufdfb\ufe70-\ufe74\ufe76-\ufefc\uff21-\uff3a\uff41-\uff5a\uff66-\uffbe\uffc2-\uffc7\uffca-\uffcf\uffd2-\uffd7\uffda-\uffdc0-9\u0300-\u036f\u0483-\u0487\u0591-\u05bd\u05bf\u05c1\u05c2\u05c4\u05c5\u05c7\u0610-\u061a\u064b-\u0669\u0670\u06d6-\u06dc\u06df-\u06e4\u06e7\u06e8\u06ea-\u06ed\u06f0-\u06f9\u0711\u0730-\u074a\u07a6-\u07b0\u07c0-\u07c9\u07eb-\u07f3\u0816-\u0819\u081b-\u0823\u0825-\u0827\u0829-\u082d\u0859-\u085b\u08e4-\u08fe\u0900-\u0903\u093a-\u093c\u093e-\u094f\u0951-\u0957\u0962\u0963\u0966-\u096f\u0981-\u0983\u09bc\u09be-\u09c4\u09c7\u09c8\u09cb-\u09cd\u09d7\u09e2\u09e3\u09e6-\u09ef\u0a01-\u0a03\u0a3c\u0a3e-\u0a42\u0a47\u0a48\u0a4b-\u0a4d\u0a51\u0a66-\u0a71\u0a75\u0a81-\u0a83\u0abc\u0abe-\u0ac5\u0ac7-\u0ac9\u0acb-\u0acd\u0ae2\u0ae3\u0ae6-\u0aef\u0b01-\u0b03\u0b3c\u0b3e-\u0b44\u0b47\u0b48\u0b4b-\u0b4d\u0b56\u0b57\u0b62\u0b63\u0b66-\u0b6f\u0b82\u0bbe-\u0bc2\u0bc6-\u0bc8\u0bca-\u0bcd\u0bd7\u0be6-\u0bef\u0c01-\u0c03\u0c3e-\u0c44\u0c46-\u0c48\u0c4a-\u0c4d\u0c55\u0c56\u0c62\u0c63\u0c66-\u0c6f\u0c82\u0c83\u0cbc\u0cbe-\u0cc4\u0cc6-\u0cc8\u0cca-\u0ccd\u0cd5\u0cd6\u0ce2\u0ce3\u0ce6-\u0cef\u0d02\u0d03\u0d3e-\u0d44\u0d46-\u0d48\u0d4a-\u0d4d\u0d57\u0d62\u0d63\u0d66-\u0d6f\u0d82\u0d83\u0dca\u0dcf-\u0dd4\u0dd6\u0dd8-\u0ddf\u0df2\u0df3\u0e31\u0e34-\u0e3a\u0e47-\u0e4e\u0e50-\u0e59\u0eb1\u0eb4-\u0eb9\u0ebb\u0ebc\u0ec8-\u0ecd\u0ed0-\u0ed9\u0f18\u0f19\u0f20-\u0f29\u0f35\u0f37\u0f39\u0f3e\u0f3f\u0f71-\u0f84\u0f86\u0f87\u0f8d-\u0f97\u0f99-\u0fbc\u0fc6\u102b-\u103e\u1040-\u1049\u1056-\u1059\u105e-\u1060\u1062-\u1064\u1067-\u106d\u1071-\u1074\u1082-\u108d\u108f-\u109d\u135d-\u135f\u1712-\u1714\u1732-\u1734\u1752\u1753\u1772\u1773\u17b4-\u17d3\u17dd\u17e0-\u17e9\u180b-\u180d\u1810-\u1819\u18a9\u1920-\u192b\u1930-\u193b\u1946-\u194f\u19b0-\u19c0\u19c8\u19c9\u19d0-\u19d9\u1a17-\u1a1b\u1a55-\u1a5e\u1a60-\u1a7c\u1a7f-\u1a89\u1a90-\u1a99\u1b00-\u1b04\u1b34-\u1b44\u1b50-\u1b59\u1b6b-\u1b73\u1b80-\u1b82\u1ba1-\u1bad\u1bb0-\u1bb9\u1be6-\u1bf3\u1c24-\u1c37\u1c40-\u1c49\u1c50-\u1c59\u1cd0-\u1cd2\u1cd4-\u1ce8\u1ced\u1cf2-\u1cf4\u1dc0-\u1de6\u1dfc-\u1dff\u200c\u200d\u203f\u2040\u2054\u20d0-\u20dc\u20e1\u20e5-\u20f0\u2cef-\u2cf1\u2d7f\u2de0-\u2dff\u302a-\u302f\u3099\u309a\ua620-\ua629\ua66f\ua674-\ua67d\ua69f\ua6f0\ua6f1\ua802\ua806\ua80b\ua823-\ua827\ua880\ua881\ua8b4-\ua8c4\ua8d0-\ua8d9\ua8e0-\ua8f1\ua900-\ua909\ua926-\ua92d\ua947-\ua953\ua980-\ua983\ua9b3-\ua9c0\ua9d0-\ua9d9\uaa29-\uaa36\uaa43\uaa4c\uaa4d\uaa50-\uaa59\uaa7b\uaab0\uaab2-\uaab4\uaab7\uaab8\uaabe\uaabf\uaac1\uaaeb-\uaaef\uaaf5\uaaf6\uabe3-\uabea\uabec\uabed\uabf0-\uabf9\ufb1e\ufe00-\ufe0f\ufe20-\ufe26\ufe33\ufe34\ufe4d-\ufe4f\uff10-\uff19\uff3f]*$/

    if (!fs.existsSync(filePath)) {
    console.log('File does not exist'.red)
    return
}

console.log('Loading files and parsing ast...'.magenta)
const source = fs.readFileSync(filePath, 'utf8'),
    ast = parse(source)

let stringObject, stringProperty, stringFunction, stringArrayInitString, stringArrayString, stringArrayHolder,
    stringArraySeparator, decodedStrings = '', stringResolvers = [], possibleStringArrayFunctions = []

// TODO: Unmask evals (partially done in pooky)

function unmaskingStuff(stringResolvers, removeRedundant)
{
    console.log("Unmasking")
    let { maskHolders, constantMasks } = maskFunctions.getMaskHolders(ast, stringResolvers, removeRedundant)
    // console.log(maskHolders, constantMasks)
    maskFunctions.unmask(ast, maskHolders, constantMasks, stringResolvers, removeRedundant)

    return { maskHolders, constantMasks }
}

console.log('Finding string decode function and its resolver functions...'.cyan)
traverse(ast, {
    VariableDeclarator(path) {
        // if (stringObject && stringProperty && stringFunction && stringArrayInitString)
        //     return

        if (types.isObjectExpression(path.node.init) && path.node.init.properties.length == 1 &&
            types.isCallExpression(path.node.init.properties[0].value) && types.isFunctionExpression(path.node.init.properties[0].value.callee) &&
            path.node.init.properties[0].value.arguments.length === 1 && types.isStringLiteral(path.node.init.properties[0].value.arguments[0])
        ) {
            const stringPath = path.getFunctionParent().getStatementParent(),
                string = stringPath.node.expression.left
            stringObject = string.object.name
            stringProperty = types.isNumericLiteral(string.property) ? string.property.value : string.property.name
            stringFunction = path.node.init.properties[0].key.name
            stringArrayInitString = path.node.init.properties[0].value.arguments[0].value
            //stringPath.remove()
            path.stop()
        }
    },
    AssignmentExpression(path) {
        if (path.node.left.object && path.node.left.object.name === stringObject) {
            // String Resolver
            if (types.isFunctionExpression(path.node.right) && path.node.right.body.body.length === 1
                && types.isReturnStatement(path.node.right.body.body[0]) && types.isConditionalExpression(path.node.right.body.body[0].argument)
                && types.isBinaryExpression(path.node.right.body.body[0].argument.test) &&
                (types.isNumericLiteral(path.node.right.body.body[0].argument.test.left.argument.property) ? path.node.right.body.body[0].argument.test.left.argument.property.value : path.node.right.body.body[0].argument.test.left.argument.property.name) === stringFunction
            ) {
                stringResolvers.push(path.node.left.property.name)
                path.parentPath.remove()
            }
        }
    }
})
console.log(`String Decode Function | Object: ${stringObject} Property: ${stringProperty} Function: ${stringFunction}`.green)
console.log(`String Resolver Functions | ${stringResolvers}`.green)

console.log('Decoding string array...'.cyan)
// Find string array functions and string array separator
traverse(ast, {
    // TODO: fix this
    // VariableDeclaration(path) {
    //     if (path.node.declarations && path.node.declarations.length === 2 &&
    //         path.node.declarations[0].init && types.isStringLiteral(path.node.declarations[0].init) &&
    //         path.node.declarations[0].init.value.length === 0 && path.node.declarations[1].init &&
    //         types.isCallExpression(path.node.declarations[1].init) && path.node.declarations[1].init.arguments.length === 1 &&
    //         types.isCallExpression(path.node.declarations[1].init.arguments[0]) && types.isCallExpression(path.node.declarations[1].init.arguments[0].callee) &&
    //         path.node.declarations[1].init.arguments[0].callee.arguments.length === 1 && types.isArrayExpression(path.node.declarations[1].init.arguments[0].callee.arguments[0]) &&
    //         path.node.declarations[1].init.arguments[0].callee.arguments[0].elements.every(n => types.isNumericLiteral(n) || (types.isUnaryExpression(n) && types.isNumericLiteral(n.argument)))
    //     ) {
    //         stringArrayHolder = path.node.declarations[0].id.name
    //         console.log(stringArrayHolder)
    //     }
    // },
    // CallExpression(path) {
    //     if (types.isMemberExpression(path.node.callee) && path.node.callee.object &&
    //         path.node.callee.object.name === stringArrayHolder && path.node.arguments.length === 1 &&
    //         types.isStringLiteral(path.node.arguments[0])
    //     ) {
    //         stringArraySeparator = path.node.arguments[0].value
    //         // console.log(path.node)
    //         path.stop()
    //     }
    // },
    AssignmentExpression(path) {
        // String array function names
        if (types.isIdentifier(path.node.right)) {
            possibleStringArrayFunctions.push(path.node.right.name)
        }
    }
})

stringArraySeparator = '%'
// too lazy to make this dynamic
var I0F = function (M0F, l0F) {
    var m0F = decodeURIComponent(M0F)
    var y0F = "";
    var E0F = 22;
    var D0F = 0;
    
    while (D0F < m0F.length) {
      var c0F = m0F.charCodeAt(D0F);
      var Q0F = c0F % 256;
      var P0F = (c0F - Q0F) / 256;
      var Y0F = l0F.charCodeAt(D0F % l0F.length);
      var f0F = Q0F ^ E0F ^ Y0F;
      E0F += 1;
      E0F %= 112;
      y0F += String.fromCharCode(P0F * 256 + f0F);
      D0F++;
    }
    return y0F
};

// Create decodedStrings array
traverse(ast, {
    FunctionDeclaration(path) {
        if (possibleStringArrayFunctions.includes(path.node.id.name) && path.node.body.body.length === 1 &&
            types.isReturnStatement(path.node.body.body[0]) && types.isStringLiteral(path.node.body.body[0].argument)
        ) {
            let stringArrayStringTemp = path.node.body.body[0].argument.value//.replace('/%(?![0-9][\\da-f]+)/gi', '%25')
            stringArrayString = I0F(stringArrayStringTemp, stringArrayInitString) //decodeURI(stringArrayStringTemp)
            
            // let xor1 = 0,
            //     xor2 = 0

            // while (xor1 < stringArrayString.length) {
            //     if (xor2 === stringArrayInitString.length)
            //         xor2 = 0

            //     decodedStrings += String.fromCharCode(stringArrayString.charCodeAt(xor1) ^ stringArrayInitString.charCodeAt(xor2))
            //     xor1++, xor2++
            // }

            decodedStrings = stringArrayString.split(stringArraySeparator) // decodedStrings.split
            // fs.writeFileSync("strings.json", JSON.stringify(decodedStrings))
            path.stop()
        }
    }
})

unshiftMap = []
console.log("Creating un-shift map for decoded strings...".cyan)
traverse(ast, {
    FunctionExpression(path) {
        const parent = path.getStatementParent()
        if (types.isVariableDeclaration(parent)) {
            const funcParent = parent.getFunctionParent()
            if (types.isFunctionExpression(funcParent)) {
                const propParent = funcParent.parentPath.parentPath
                if (types.isObjectProperty(propParent) && propParent.node.key.name === stringFunction) {
                    // path.node.body.body.pop()
                    if (path.node.body.body.length > 0 && path.node.body.body.every(_ins => types.isIfStatement(_ins))) {
                        // let indexArg = path.node.params[0].name
                        for (const _if of path.node.body.body) {
                           const expression = _if.consequent.body[0].expression.arguments[1],
                                uFirst = expression.callee.object.arguments,
                                uSecond = expression.arguments
                            
                            // TODO: make this dynamic. currently, this only works if the if statement is in the following format: if (count == 0 && index == 619)
                            //       also, this only works if the if statements are in least to greatest order of the count
                            //       and finally, it also only works if the unshiftMap index is increased by a static amount (1) every time
                            //       see o0F in examples (used in p0F function)
                            unshiftMap[_if.test.left.right.value] = {
                                index: _if.test.right.right.value,
                                first: [generate(uFirst[0]).code, generate(uFirst[1]).code],
                                second: [generate(uSecond[0]).code, generate(uSecond[1]).code]
                            }
                       }
                       path.stop()
                       return
                    }
                }
            }
        }
    }
})

// TODO: replace globalThis calls with window (ex: var d7D = d4ss.K5P; d7D.String.charCodeAt())


// unmaskingStuff(false)
let { maskHolders, constantMasks } = unmaskingStuff(stringResolvers, false)
// console.log(maskHolders, constantMasks)
maskFunctions.evalConstants(ast)

let decodedStringCount = 0,
    unshiftCount = 0
console.log('Replacing obfuscated strings...'.cyan)
traverse(ast, {
    CallExpression(path) {
      if (types.isMemberExpression(path.node.callee) && stringResolvers.includes(path.node.callee.property.name) /* && path.node.arguments.length > 0 */) {
          
        //console.log(path.node.callee.property.name)
        let val = path.node.arguments[0]
        if (val === undefined)
            return
        else if (types.isNumericLiteral(val))
            val = val.value
        else if (types.isStringLiteral(val))
            val = parseInt(val.value)
        else if (types.isIdentifier(val)) {
            if (val.name in constantMasks) {
                // console.log(val.name)
                val = constantMasks[val.name]
            }
        }
        else if (types.isUnaryExpression(val)) {
            if (types.isIdentifier(val.argument) && val.argument.name in constantMasks) {
                val = val.operator === '+' ? constantMasks[val.argument.name] : -constantMasks[val.argument.name]
            }
            else if (types.isMemberExpression(val.argument) && val.argument.object.name in maskHolders) {
                if (types.isNumericLiteral(val.argument.property) || (types.isStringLiteral(val.argument.property) && isNumeric(val.argument.property)))
                    val = maskHolders[val.argument.object.name][parseInt(val.argument.property.value)]
                else if (types.isIdentifier(val.argument.property) && val.argument.property in constantMasks) {
                    val = maskHolders[val.argument.object.name][constantMasks[parseInt(val.argument.property.value)]]
                }
            }
            // else
            //     console.log(val)
        }
        else if (types.isBinaryExpression(val)) {
            // let left = val.left,
            //     right = val.right
            
            // if (types.isIdentifier(left) && left.name in constantMasks)
            //     left = constantMasks[left.name]
            // else
            //     left = left.value

            // if (types.isIdentifier(right) && right.name in constantMasks)
            //     right = constantMasks[right.name]
            // else
            //     right = right.value

            // if (left == undefined)
            //     console.log(val)

            // let ev = `${left} ${val.operator} ${right}`
            // val = eval(ev)
            // console.log(ev, val)
            if (types.isIdentifier(val.left) && val.left.name in constantMasks)
                val = constantMasks[val.left.name] 
            else if (types.isMemberExpression(val.left) && val.left.object.name in maskHolders) {
                if (types.isNumericLiteral(val.left.property) || (types.isStringLiteral(val.left.property) && isNumeric(val.left.property)))
                    val = maskHolders[val.left.object.name][parseInt(val.left.property.value)]
                else if (types.isIdentifier(val.left.property) && val.left.property in constantMasks) {
                    val = maskHolders[val.left.object.name][constantMasks[parseInt(val.left.property.value)]]
                }
            }
            // else
            //     console.log(val)
        }

        // TODO: see notes in unshiftMap creation
        let unshift = unshiftMap[unshiftCount]
        if (unshift && unshift.index == val) {
            console.log(`Unshifted decoded strings array #${unshiftCount}`.green)
            decodedStrings.unshift.apply(decodedStrings, decodedStrings.splice(unshift.first[0], unshift.first[1]).splice(unshift.second[0], unshift.second[1]))
            fs.writeFileSync(`./samples/strings_decoded/strings_${unshiftCount}.json`, JSON.stringify(decodedStrings))
            unshiftCount++
        }
          if (typeof(decodedStrings[val]) != 'string') {
            // console.log(val)
            return
          }
        path.replaceWith(types.stringLiteral(decodedStrings[val]))
        decodedStringCount++;
      }  
    },
    StringLiteral(path) { // Revert hexadecimal strings
        if (path.node.extra != undefined)
            delete path.node.extra.raw
    }
})
console.log(`Decoded ${decodedStringCount} strings`.green)

unmaskingStuff([], false) // second iteration
unmaskingStuff([], true) // last iteration
maskFunctions.evalConstants(ast)

console.log('Evaluating constants...'.cyan)
traverse(ast, {
    BinaryExpression(path) {
        let code = generate(path.node).code
        if (/[a-zA-Z]/.test(code))
            return
        
        let evaluated = eval(code)
        if (evaluated != undefined)
            path.replaceWith(types.valueToNode(evaluated))
    },
    UnaryExpression(path) {
        if (types.isStringLiteral(path.node.argument)) {
            if (path.node.operator === '+')
                path.replaceWith(types.NumericLiteral(parseInt(path.node.argument.value)))
            
        } else if (types.isUnaryExpression(path.node.argument)) {
            if (path.node.operator === '-' && path.node.argument.operator === '+') {
                path.replaceWith(types.NumericLiteral(-parseInt(path.node.argument.argument.value)))
            }
        }
    }
})

// TODO: String joining (https://docs.jscrambler.com/code-integrity/documentation/transformations/string-splitting)

console.log('Beautifying...'.cyan)
traverse(ast, {
    MemberExpression(path) { // Bracket to dot notation (ex. navigator["plugins"] -> navigator.plugins)
        if(types.isStringLiteral(path.node.property) && validIdentifierRegex.test(path.node.property.value)) {
            path.replaceWith(types.memberExpression(path.node.object, types.identifier(path.node.property.value), false));
        }
    }
})

let code = generate(ast, {}, source).code
// code = beautify(code, {indent_size: 2, space_in_empty_paren: true})

console.log(`Finished routines! Total time taken: ${Date.now() - beginTime}ms`.brightYellow)

console.log('Saving cleaned file...'.magenta)
fs.writeFileSync(outputFilePath, code)
console.log('Done! Happy reversing :)'.magenta)