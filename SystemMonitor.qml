import QtQuick
import Quickshell.Io
import "model/Proc.js" as Proc

Item {
  id: root

  property int intervalMs: 2000
  property bool active: true

  property var cpuPercent: null
  property var memory: null
  readonly property var memPercent: memory
    ? Math.round((memory.usedKb / memory.totalKb) * 1000) / 10
    : null

  property var previousCpu: null

  FileView { id: statFile; path: "/proc/stat"; blockLoading: true }
  FileView { id: memFile; path: "/proc/meminfo"; blockLoading: true }

  function sample() {
    statFile.reload()
    memFile.reload()

    var current = Proc.parseCpu(statFile.text())
    if (current) {
      cpuPercent = Proc.cpuPercent(previousCpu, current)
      previousCpu = current
    }

    memory = Proc.parseMemory(memFile.text())
  }

  Timer {
    interval: root.intervalMs
    running: root.active
    repeat: true
    // One extra read buys a filled-in memory meter the instant the bar
    // appears. CPU still needs the second tick, which is what "--" is for.
    triggeredOnStart: true
    onTriggered: root.sample()
  }
}
