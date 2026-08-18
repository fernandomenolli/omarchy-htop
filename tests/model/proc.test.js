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

const MEMINFO = [
  "MemTotal:       31965652 kB",
  "MemFree:         1203552 kB",
  "MemAvailable:   22967448 kB",
  "Buffers:            2456 kB",
  "Cached:         23332500 kB",
].join("\n")

test("parseMemory counts what is unavailable, not what is unfree", () => {
  eq(Proc.parseMemory(MEMINFO), { usedKb: 8998204, totalKb: 31965652 })
})

test("parseMemory returns null without MemAvailable", () => {
  eq(Proc.parseMemory("MemTotal: 31965652 kB\nMemFree: 1203552 kB"), null)
})

test("parseMemory returns null on empty input", () => {
  eq(Proc.parseMemory(""), null)
})

// One line per process: pid, utime+stime in jiffies, RSS in pages, then the
// command name last so a name with a space in it cannot break the split.
const PROCESSES = [
  "1 4210 3312 systemd",
  "1046 0 0 kworker/21:1H-kblockd",
  "286275 91544 148902 ruby",
  "211194 250310 512044 chromium",
  "512 33 900 Web Content",
].join("\n")

test("parseProcesses keys by pid and keeps a name with a space in it", () => {
  eq(Proc.parseProcesses(PROCESSES)["512"], { ticks: 33, rssPages: 900, name: "Web Content" })
})

test("parseProcesses skips a line it cannot read", () => {
  eq(Proc.parseProcesses("garbage\n7 12 40 bash"), { "7": { ticks: 12, rssPages: 40, name: "bash" } })
})

test("topProcesses ranks by the jiffies each process burned since last time", () => {
  const previous = Proc.parseProcesses(PROCESSES)
  const current = Proc.parseProcesses([
    "1 4210 3312 systemd",
    "286275 91644 148902 ruby",
    "211194 250330 512044 chromium",
  ].join("\n"))

  eq(Proc.topProcesses(previous, current, 4000, 2), [
    { name: "ruby", percent: 2.5 },
    { name: "chromium", percent: 0.5 },
  ])
})

test("topProcesses ignores a process that burned nothing", () => {
  const sample = Proc.parseProcesses("7 12 40 bash")
  eq(Proc.topProcesses(sample, sample, 4000, 5), [])
})

test("topProcesses has nothing to rank on the first sample", () => {
  eq(Proc.topProcesses(null, Proc.parseProcesses(PROCESSES), 4000, 5), [])
})

test("topProcesses skips a process that was not there last time", () => {
  const previous = Proc.parseProcesses("7 12 40 bash")
  const current = Proc.parseProcesses("7 12 40 bash\n9 300 40 htop")
  eq(Proc.topProcesses(previous, current, 4000, 5), [])
})

test("parseLoadavg takes the three averages", () => {
  eq(Proc.parseLoadavg("1.20 0.90 0.70 2/1234 56789"), [1.2, 0.9, 0.7])
})

test("parseLoadavg returns null on nonsense", () => {
  eq(Proc.parseLoadavg("nope"), null)
})

test("parseUptime takes the seconds the machine has been up", () => {
  eq(Proc.parseUptime("345678.90 8123456.78"), 345678.9)
})

test("parseUptime returns null on nonsense", () => {
  eq(Proc.parseUptime(""), null)
})
