function test(args, expected) {
  let result = deepEquals(...args)

  if (result !== expected) {
    console.error("Test failed")
    console.log(args)
  }

  console.log("Test passed", args)
}

////////////////////////////////

test(
  [
    {a: 1, b: [true, false, "hi"], c: 3},
    {c: 3, a: 1, b: [true, false, "hi"]}
  ],
  true
)

test(
  [
    {a: 1, b: [true, 0, "hi"], c: 3},
    {c: 3, a: 1, b: [true, false, "hi"]}
  ],
  false
)

test(
  [
    {a: 1, b: [true, 0, "hi"], c: 3},
    {c: 3, a: 1, b: [true, false, "hi"]},
    (a, b) => a == b
  ],
  true
)

test(
  [
    {a: {b: {c: {d: {e: 5}}}}},
    {a: {b: {c: {d: {e: 5}}}}}
  ],
  true
)

test(
  [
    {a: {b: {c: {d: {e: 5}}}}},
    {a: {b: {c: {d: {e: "5"}}}}}
  ],
  false
)

let recursiveA = {}, recursiveB = {}
recursiveA.a = recursiveA
recursiveB.a = {a: recursiveB}

test(
  [recursiveA, recursiveB],
  true
)
