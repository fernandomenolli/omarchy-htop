import QtQuick
import QtQuick.Controls
import Quickshell
import Quickshell.Io
import qs.Commons
import qs.Ui
import "model/Format.js" as Format

// Two meters in the bar, and a panel that answers the question that makes
// anyone open a system monitor: what is eating this machine right now. The
// full htop is one button away rather than the first thing you get, and it
// opens as an ordinary window you manage like any other.
Panel {
  id: root
  moduleName: "io.github.fernandomenolli.htop"
  ipcTarget: "io.github.fernandomenolli.htop"

  readonly property int refreshIntervalMs: setting("refreshIntervalMs", 2000)
  readonly property string showMode: setting("show", "both")
  readonly property int urgentThreshold: setting("urgentThreshold", 85)
  readonly property int processLimit: setting("processLimit", 4)

  readonly property bool showCpu: showMode !== "memory"
  readonly property bool showMemory: showMode !== "cpu"
  readonly property bool vertical: bar ? bar.vertical : false
  readonly property color foreground: bar ? bar.foreground : Color.foreground
  readonly property color urgentColor: bar ? bar.urgent : Color.urgent
  readonly property string fontFamily: bar ? bar.fontFamily : Style.font.family

  readonly property bool cpuUrgent: monitor.cpuPercent !== null && monitor.cpuPercent >= urgentThreshold
  readonly property bool memoryUrgent: monitor.memPercent !== null && monitor.memPercent >= urgentThreshold
  readonly property string reading: Format.tooltip(monitor.cpuPercent, monitor.memory)
  readonly property string scriptPath: Qt.resolvedUrl("bin/htop-window").toString().replace("file://", "")

  implicitWidth: group.implicitWidth
  implicitHeight: group.implicitHeight

  // Focuses the window when one is already open, which is what makes a second
  // click do the obvious thing rather than pile up terminals.
  function openHtop() {
    close()
    Quickshell.execDetached([scriptPath])
  }

  // Written back to shell.json the way the clock writes its cycled format, so
  // a right click is the setting from then on rather than something that
  // reverts on restart.
  function cycleShowMode() {
    var entry = { id: root.moduleName }
    for (var key in root.settings) if (key !== "id") entry[key] = root.settings[key]
    entry.show = Format.nextShowMode(root.showMode)

    root.settings = entry
    if (root.bar && root.bar.shell && typeof root.bar.shell.updateEntryInline === "function")
      root.bar.shell.updateEntryInline(root.moduleName, entry)
  }

  SystemMonitor {
    id: monitor
    intervalMs: root.refreshIntervalMs
    active: root.visible
    detailed: root.opened
    processLimit: root.processLimit
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
      active: root.cpuUrgent
      tooltipText: root.reading
      onPressed: function(button) {
        if (button === Qt.RightButton) root.cycleShowMode()
        else root.toggle()
      }
    }

    WidgetButton {
      bar: root.bar
      visible: root.showMemory
      horizontalMargin: 4.5
      text: root.vertical ? "󰍛" : "󰍛 " + Format.percent(monitor.memPercent)
      active: root.memoryUrgent
      tooltipText: root.reading
      onPressed: function(button) {
        if (button === Qt.RightButton) root.cycleShowMode()
        else root.toggle()
      }
    }
  }

  KeyboardPanel {
    id: panel
    anchorItem: group
    owner: root
    bar: root.bar
    open: root.opened
    focusTarget: keyCatcher
    contentWidth: panel.fittedContentWidth(Style.space(320))
    contentHeight: panel.fittedContentHeight(column.implicitHeight, Style.space(620))

    PanelKeyCatcher {
      id: keyCatcher
      anchors.fill: parent
      onCloseRequested: root.close()
      onActivateRequested: root.openHtop()
      onTabRequested: function(direction) { root.switchPanel(direction) }

      Flickable {
        id: flick
        anchors.fill: parent
        contentWidth: width
        contentHeight: column.implicitHeight
        clip: true
        boundsBehavior: Flickable.StopAtBounds
        flickableDirection: Flickable.VerticalFlick
        interactive: contentHeight > height
        ScrollBar.vertical: ScrollBar { policy: ScrollBar.AsNeeded }

        Column {
          id: column
          width: flick.width
          spacing: Style.space(12)

          PanelHero {
            foreground: root.foreground
            fontFamily: root.fontFamily
            title: "htop"
            meta: Format.uptimeLabel(monitor.uptimeSeconds)
            iconComponent: Component {
              Text {
                text: "󰻠"
                color: root.foreground
                font.family: root.fontFamily
                font.pixelSize: Style.font.display
              }
            }
          }

          PanelSeparator { foreground: root.foreground }

          Meter {
            label: "CPU"
            value: Format.percent(monitor.cpuPercent)
            fraction: (monitor.cpuPercent || 0) / 100
            urgent: root.cpuUrgent
            foreground: root.foreground
            urgentColor: root.urgentColor
            fontFamily: root.fontFamily
          }

          Meter {
            label: "MEMORY"
            value: Format.memoryLabel(monitor.memory)
            fraction: (monitor.memPercent || 0) / 100
            urgent: root.memoryUrgent
            foreground: root.foreground
            urgentColor: root.urgentColor
            fontFamily: root.fontFamily
          }

          PanelSeparator { foreground: root.foreground }

          ProcessList {
            title: "TOP CPU"
            foreground: root.foreground
            fontFamily: root.fontFamily
            rows: monitor.processes.map(function(entry) {
              return { name: entry.name, label: entry.percent.toFixed(1) + "%" }
            })
          }

          ProcessList {
            title: "TOP MEMORY"
            foreground: root.foreground
            fontFamily: root.fontFamily
            rows: monitor.memoryHogs.map(function(entry) {
              return { name: entry.name, label: Format.bytes(entry.bytes) }
            })
          }

          PanelSeparator { foreground: root.foreground }

          Button {
            width: parent.width
            text: "Open htop"
            iconText: "󰆍"
            bordered: true
            foreground: root.foreground
            fontFamily: root.fontFamily
            onClicked: root.openHtop()
          }
        }
      }
    }
  }
}
