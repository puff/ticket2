const fs = require('fs')

let map = {}

function r7m(size, skip, m7m) {
  var U7m = [];
  var k7m;
  var t7m;
  var J7m;
  var a7m;
  var G7m;
  var g7m;
  var D7m;
  var v7m;
  k7m = 0;

  while (k7m < size) {
    U7m[k7m] = [];
    k7m += 1;
  }

  t7m = 0;


  while (t7m < size) 
  {
    J7m = size - 1;

    while (J7m /*815*/ >= 0) {
      a7m = 0;
      G7m = 0;
      g7m = 0 /*G7m*/;

      //console.log(G7m)
      do {
        g7m = G7m;
        G7m = m7m[a7m]; 
        D7m = G7m - g7m; // 14 or 802
        a7m++;
              //console.log(J7m, G7m)
      } while (J7m >= G7m); // G7m: first iteration is 0, second is 14, third is 816

      v7m = g7m + (J7m - g7m + skip * t7m) % D7m;
    
        
      //if (t7m == 60 && v7m == 728)
      //  console.log(J7m)
      if (J7m == 548)
        console.log(`[${t7m}][${v7m}]`)//, J7m)
      
      // if (!map[J7m])
      //   map[J7m] = []
      // map[J7m].push(`[${t7m}][${v7m}]`)
      
      
      U7m[t7m][v7m] = U7m[J7m];
      J7m -= 1;

    }

    t7m += 1;
  }

  return U7m;
}

var a = r7m(816, 3, [14, 816])

// let arr = []
// const size = 816,
//     skip = 3
// for (let i = size - 1; i > 0; i--) { // i = t7m
//   for (let b = 0; b < 816; b++) {
//     for (let c = 0; c < 816; c += 3) {
//       console.log(i, b, c)
//     }
//   }
// }


//fs.writeFileSync("map.json", JSON.stringify(map))