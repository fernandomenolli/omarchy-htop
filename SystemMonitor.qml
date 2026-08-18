import QtQuick
import Quickshell.Io
import "model/Proc.js" as Proc

Item {
  id: root

  property int intervalMs: 2000
  property bool active: true
  // The process table costs one subprocess a tick, so it is only sampled
  // while something is actually showing it.
  property bool detailed: false
  property int processLimit: 4

  property var cpuPercent: null
  property var memory: null
  property var loadAverages: null
  property var uptimeSeconds: null
  property var coreCount: null
  property var processes: []
  property var memoryHogs: []

  readonly property var memPercent: memory
    ? Math.round((memory.usedKb / memory.totalKb) * 1000) / 10
    : null

  property var previousCpu: null
  property var previousProcesses: null
  property var previousScanCpu: null

  // The scan carries /proc/stat's own header so a process's share is measured
  // against the jiffies of the very same instant. Timing the two reads apart
  // was worth up to a factor of two on the figures.
  //
  // The command name goes last so a name with a space in it cannot break the
  // split, and utime+stime come straight out of /proc rather than from ps,
  // whose %CPU is an average over the process's whole life.
  readonly property string processCommand:
    'getconf PAGESIZE; head -1 /proc/stat; ' +
    'awk \'FNR==1{ o=index($0,"("); c=index($0,") "); split(substr($0,c+2),f," "); ' +
    'print substr($0,1,o-2), f[12]+f[13], f[22], substr($0,o+1,c-o-1) }\' ' +
    '/proc/[0-9]*/stat 2>/dev/null'

  FileView { id: statFile; path: "/proc/stat"; blockLoading: true }
  FileView { id: memFile; path: "/proc/meminfo"; blockLoading: true }
  FileView { id: loadFile; path: "/proc/loadavg"; blockLoading: true }
  FileView { id: uptimeFile; path: "/proc/uptime"; blockLoading: true }

  function sample() {
    statFile.reload()
    memFile.reload()

    var current = Proc.parseCpu(statFile.text())
    if (current) {
      cpuPercent = Proc.cpuPercent(previousCpu, current)
      previousCpu = current
    }

    if (coreCount === null) coreCount = Proc.coreCount(statFile.text())

    memory = Proc.parseMemory(memFile.text())

    // Load and uptime are only ever shown in the panel, so a closed bar reads
    // two files a tick instead of four.
    if (!detailed) return

    loadFile.reload()
    uptimeFile.reload()
    loadAverages = Proc.parseLoadavg(loadFile.text())
    uptimeSeconds = Proc.parseUptime(uptimeFile.text())

    if (!processScan.running) processScan.running = true
  }

  onDetailedChanged: {
    if (detailed) { sample(); primeScan.restart() }
    else {
      processes = []
      memoryHogs = []
      previousProcesses = null
      previousScanCpu = null
    }
  }

  Process {
    id: processScan
    command: ["bash", "-c", root.processCommand]
    stdout: StdioCollector {
      waitForEnd: true
      onStreamFinished: {
        var scanCpu = Proc.parseCpu(text)
        var current = Proc.parseProcesses(text)
        var elapsed = root.previousScanCpu && scanCpu
          ? scanCpu.total - root.previousScanCpu.total : 0

        root.processes = Proc.topProcesses(root.previousProcesses, current,
                                           elapsed, root.processLimit)
        root.memoryHogs = Proc.topMemory(current, Proc.parsePageSize(text), root.processLimit)
        root.previousProcesses = current
        root.previousScanCpu = scanCpu
      }
    }
  }

  // A ranked list needs two scans to exist at all. Taking the second one
  // early fills the panel in half a second instead of leaving it reading
  // "Reading…" for a whole refresh interval.
  Timer {
    id: primeScan
    interval: 500
    repeat: false
    onTriggered: if (root.detailed && !processScan.running) processScan.running = true
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
