import QtQuick
import qs.Commons
import qs.Ui

// One ranked list: a section header, its rows, and a placeholder for the tick
// before the first scan lands. Both lists in the panel are this.
Column {
  id: root

  property string title: ""
  property var rows: []
  property color foreground: Color.foreground
  property string fontFamily: Style.font.family

  width: parent ? parent.width : implicitWidth
  spacing: Style.space(4)

  PanelSectionHeader {
    text: root.title
    foreground: root.foreground
    fontFamily: root.fontFamily
    bottomPadding: Style.space(2)
  }

  Text {
    visible: root.rows.length === 0
    text: "Reading…"
    color: Qt.darker(root.foreground, 1.7)
    font.family: root.fontFamily
    font.pixelSize: Style.font.body
  }

  Repeater {
    model: root.rows

    Item {
      required property var modelData
      width: root.width
      implicitHeight: Math.max(name.implicitHeight, value.implicitHeight)

      Text {
        id: name
        anchors.left: parent.left
        anchors.right: value.left
        anchors.rightMargin: Style.space(12)
        anchors.verticalCenter: parent.verticalCenter
        text: modelData.name
        color: root.foreground
        font.family: root.fontFamily
        font.pixelSize: Style.font.body
        elide: Text.ElideRight
      }

      Text {
        id: value
        anchors.right: parent.right
        anchors.verticalCenter: parent.verticalCenter
        text: modelData.label
        color: Qt.darker(root.foreground, 1.4)
        font.family: root.fontFamily
        font.pixelSize: Style.font.body
      }
    }
  }
}
