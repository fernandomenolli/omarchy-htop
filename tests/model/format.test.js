const { load, test, eq } = require("../harness.js")
const Format = load("Format.js")

test("percent drops the decimal the bar has no room for", () => {
  eq(Format.percent(34.4), "34%")
  eq(Format.percent(99.6), "100%")
})

test("percent says so when there is nothing to say yet", () => {
  eq(Format.percent(null), "--")
})

test("gigabytes keeps one decimal", () => {
  eq(Format.gigabytes(8998204), "8.6G")
  eq(Format.gigabytes(31965652), "30.5G")
})

test("gigabytes is empty rather than wrong when there is no reading", () => {
  eq(Format.gigabytes(null), "")
})

test("tooltip spells out what the bar abbreviates", () => {
  eq(Format.tooltip(34.4, { usedKb: 8998204, totalKb: 31965652 }),
     "CPU 34%  ·  MEM 8.6G / 30.5G")
})

test("tooltip degrades to the half it has", () => {
  eq(Format.tooltip(null, null), "CPU --")
})

test("nextShowMode cycles and wraps", () => {
  eq(Format.nextShowMode("both"), "cpu")
  eq(Format.nextShowMode("cpu"), "memory")
  eq(Format.nextShowMode("memory"), "both")
})

test("nextShowMode recovers from a value nobody recognises", () => {
  eq(Format.nextShowMode("nonsense"), "both")
})

test("uptime says days and hours once a machine has been up that long", () => {
  eq(Format.uptime(345678), "4d 00h")
  eq(Format.uptime(4 * 86400 + 2 * 3600 + 660), "4d 02h")
})

test("uptime drops to hours and minutes within a day", () => {
  eq(Format.uptime(3 * 3600 + 21 * 60), "3h 21m")
})

test("uptime drops to minutes within an hour", () => {
  eq(Format.uptime(12 * 60 + 40), "12m")
})

test("uptime is empty rather than wrong when there is no reading", () => {
  eq(Format.uptime(null), "")
})

test("load is the one-minute average as a share of the cores available", () => {
  eq(Format.load([1.55, 1.19, 1.17], 24), "6%")
  eq(Format.load([12.0, 1.19, 1.17], 24), "50%")
})

test("load can read past 100% when more is queued than there are cores", () => {
  eq(Format.load([36.0, 1.19, 1.17], 24), "150%")
})

test("load falls back to the bare average when the core count is unknown", () => {
  eq(Format.load([1.55, 1.19, 1.17], null), "1.55")
})

test("load is empty rather than wrong when there is no reading", () => {
  eq(Format.load(null, 24), "")
})

test("memoryLabel reads as used of total", () => {
  eq(Format.memoryLabel({ usedKb: 8998204, totalKb: 31965652 }), "8.6G / 30.5G")
})

test("memoryLabel says so when there is nothing to say yet", () => {
  eq(Format.memoryLabel(null), "--")
})

test("metaLine says the load against the cores it has to spend", () => {
  eq(Format.metaLine([1.55, 1.19, 1.17], 345678, 24), "load 6%   ·   up 4d 00h")
})

test("metaLine leaves the load bare when the core count is unknown", () => {
  eq(Format.metaLine([1.55, 1.19, 1.17], null, null), "load 1.55")
})

test("metaLine drops the half it does not have", () => {
  eq(Format.metaLine(null, 345678, 24), "up 4d 00h")
  eq(Format.metaLine(null, null, 24), "")
})

test("bytes switches unit where the number stops being readable", () => {
  eq(Format.bytes(2097332224), "1.95G")
  eq(Format.bytes(609902592), "582M")
  eq(Format.bytes(940 * 1024), "940K")
})

test("bytes is empty rather than wrong when there is no reading", () => {
  eq(Format.bytes(null), "")
})
