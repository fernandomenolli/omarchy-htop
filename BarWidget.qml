import QtQuick
import qs.Ui

BarWidget {
  id: root
  moduleName: "io.github.fernandomenolli.htop"

  implicitWidth: button.implicitWidth
  implicitHeight: button.implicitHeight

  WidgetButton {
    id: button
    anchors.fill: parent
    bar: root.bar
    text: "󰻠 --"
    tooltipText: "htop"
  }
}
