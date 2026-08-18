const { load, test, eq } = require("../harness.js")
const Proc = load("Proc.js")

const STAT = [
  "cpu  909912 785 115028 31657426 9424 24196 14497 0 0 0",
  "cpu0 38146 32 4826 1318034 401 1010 1201 0 0 0",
  "intr 123456789 0 0",
].join("\n")

test("parseCpu sums every field into total and keeps idle apart", () => {
  eq(Proc.parseCpu(STAT), { total: 32731268, idle: 31666850 })
})

test("parseCpu returns null when there is no aggregate cpu line", () => {
  eq(Proc.parseCpu("cpu0 1 2 3 4 5 6 7\nintr 9"), null)
})

test("parseCpu returns null on a truncated line", () => {
  eq(Proc.parseCpu("cpu  909912 785"), null)
})

test("cpuPercent is busy time over elapsed time", () => {
  eq(Proc.cpuPercent({ total: 1000, idle: 900 }, { total: 1200, idle: 1050 }), 25)
})

test("cpuPercent rounds to one decimal", () => {
  eq(Proc.cpuPercent({ total: 0, idle: 0 }, { total: 300, idle: 200 }), 33.3)
})

test("cpuPercent has no previous sample to work from on the first tick", () => {
  eq(Proc.cpuPercent(null, { total: 1200, idle: 1050 }), null)
})

test("cpuPercent does not divide by zero when the counters did not advance", () => {
  const sample = { total: 1000, idle: 900 }
  eq(Proc.cpuPercent(sample, sample), null)
})

test("cpuPercent clamps a counter reset rather than reporting a negative", () => {
  eq(Proc.cpuPercent({ total: 5000, idle: 4000 }, { total: 1200, idle: 1050 }), null)
})
