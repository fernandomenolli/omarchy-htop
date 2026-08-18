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
