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

function uptime(seconds) {
  if (seconds === null || seconds === undefined) return ""

  var days = Math.floor(seconds / 86400)
  var hours = Math.floor((seconds % 86400) / 3600)
  var minutes = Math.floor((seconds % 3600) / 60)

  if (days > 0) return days + "d " + (hours < 10 ? "0" : "") + hours + "h"
  if (hours > 0) return hours + "h " + (minutes < 10 ? "0" : "") + minutes + "m"
  return minutes + "m"
}

function memoryLabel(memory) {
  if (!memory) return "--"
  return gigabytes(memory.usedKb) + " / " + gigabytes(memory.totalKb)
}

function uptimeLabel(seconds) {
  var value = uptime(seconds)
  return value === "" ? "" : "up " + value
}

function bytes(value) {
  if (value === null || value === undefined) return ""

  if (value >= 1073741824) return (Math.round((value / 1073741824) * 100) / 100).toFixed(2) + "G"
  if (value >= 1048576) return Math.round(value / 1048576) + "M"
  return Math.round(value / 1024) + "K"
}
