.pragma library

var SHOW_MODES = ["both", "cpu", "memory"]

function percent(value) {
  return value === null || value === undefined ? "--" : Math.round(value) + "%"
}

function gigabytes(kb) {
  if (kb === null || kb === undefined) return ""
  return (Math.round((kb / 1048576) * 10) / 10).toFixed(1) + "G"
}

function tooltip(cpuValue, memory) {
  var line = "CPU " + percent(cpuValue)
  if (!memory) return line
  return line + "  ·  MEM " + gigabytes(memory.usedKb) + " / " + gigabytes(memory.totalKb)
}

function nextShowMode(current) {
  var index = SHOW_MODES.indexOf(current)
  return index === -1 ? SHOW_MODES[0] : SHOW_MODES[(index + 1) % SHOW_MODES.length]
}
