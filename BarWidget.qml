import QtQuick
import qs.Ui
import "model/Format.js" as Format

BarWidget {
  id: root
  moduleName: "io.github.fernandomenolli.htop"

  readonly property int refreshIntervalMs: setting("refreshIntervalMs", 2000)
  readonly property string showMode: setting("show", "both")
  readonly property int urgentThreshold: setting("urgentThreshold", 85)

  readonly property bool showCpu: showMode !== "memory"
  readonly property bool showMemory: showMode !== "cpu"
  readonly property string reading: Format.tooltip(monitor.cpuPercent, monitor.memory)

  implicitWidth: group.implicitWidth
  implicitHeight: group.implicitHeight

  SystemMonitor {
    id: monitor
    intervalMs: root.refreshIntervalMs
    active: root.visible
  }

  // One column on a vertical bar, one row on a horizontal one: two 28px-wide
  // buttons side by side would hang off the edge of a side bar.
  Grid {
    id: group
    anchors.centerIn: parent
    columns: root.vertical ? 1 : 2

    WidgetButton {
      bar: root.bar
      visible: root.showCpu
      horizontalMargin: 4.5
      text: root.vertical ? "󰻠" : "󰻠 " + Format.percent(monitor.cpuPercent)
      active: monitor.cpuPercent !== null && monitor.cpuPercent >= root.urgentThreshold
      tooltipText: root.reading
    }

    WidgetButton {
      bar: root.bar
      visible: root.showMemory
      horizontalMargin: 4.5
      text: root.vertical ? "󰍛" : "󰍛 " + Format.percent(monitor.memPercent)
      active: monitor.memPercent !== null && monitor.memPercent >= root.urgentThreshold
      tooltipText: root.reading
    }
  }
}
