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
