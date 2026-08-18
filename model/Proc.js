.pragma library

function parseCpu(text) {
  var line = String(text || "").split("\n").find(function(candidate) {
    return candidate.indexOf("cpu ") === 0
  })
  if (!line) return null

  var fields = line.trim().split(/\s+/).slice(1).map(Number)
  if (fields.length < 5 || fields.some(isNaN)) return null

  var total = fields.reduce(function(sum, value) { return sum + value }, 0)
  // iowait counts as idle here because that is where htop counts it.
  return { total: total, idle: fields[3] + fields[4] }
}

function cpuPercent(previous, current) {
  if (!previous || !current) return null

  var elapsed = current.total - previous.total
  var idle = current.idle - previous.idle
  if (elapsed <= 0 || idle < 0) return null

  return Math.round(((elapsed - idle) / elapsed) * 1000) / 10
}

function meminfoField(text, name) {
  var match = String(text || "").match(new RegExp("^" + name + ":\\s+(\\d+)\\s+kB", "m"))
  return match ? Number(match[1]) : null
}

function parseMemory(text) {
  var total = meminfoField(text, "MemTotal")
  // MemTotal - MemFree would call a machine with a warm page cache nearly
  // full. MemAvailable is the kernel's own estimate of what a new allocation
  // could actually have, which is what htop's memory bar effectively shows.
  var available = meminfoField(text, "MemAvailable")
  if (total === null || available === null || total <= 0) return null

  return { usedKb: total - available, totalKb: total }
}

function parseProcesses(text) {
  var table = {}
  var lines = String(text || "").split("\n")

  for (var i = 0; i < lines.length; i++) {
    var parts = lines[i].trim().split(" ")
    if (parts.length < 4) continue

    var pid = parts[0]
    var ticks = Number(parts[1])
    var rssPages = Number(parts[2])
    var name = parts.slice(3).join(" ")
    if (!/^\d+$/.test(pid) || isNaN(ticks) || isNaN(rssPages) || name === "") continue

    table[pid] = { ticks: ticks, rssPages: rssPages, name: name }
  }

  return table
}

// Ranked against the same all-core jiffy delta the CPU meter uses, so the
// figures here add up to the meter above them rather than to htop's per-core
// scale where one busy thread reads 100%.
function topProcesses(previous, current, totalDelta, limit) {
  if (!previous || !current || !totalDelta || totalDelta <= 0) return []

  var ranked = []
  for (var pid in current) {
    var before = previous[pid]
    if (!before) continue

    var burned = current[pid].ticks - before.ticks
    if (burned <= 0) continue

    ranked.push({
      name: current[pid].name,
      percent: Math.round((burned / totalDelta) * 1000) / 10
    })
  }

  ranked.sort(function(a, b) { return b.percent - a.percent })
  return ranked.slice(0, limit)
}

function parseLoadavg(text) {
  var fields = String(text || "").trim().split(/\s+/).slice(0, 3).map(Number)
  if (fields.length < 3 || fields.some(isNaN)) return null
  return fields
}

function parseUptime(text) {
  var first = String(text || "").trim().split(/\s+/)[0]
  if (first === "") return null

  var seconds = Number(first)
  return isNaN(seconds) ? null : seconds
}
