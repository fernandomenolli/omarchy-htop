import QtQuick
import qs.Commons

// A labelled bar. The fill tracks the theme's foreground until the reading
// crosses the urgent threshold, which is the only colour this panel ever uses
// to say something.
Item {
  id: root

  property string label: ""
  property string value: ""
  property real fraction: 0
  property bool urgent: false
  property color foreground: Color.foreground
  property color urgentColor: Color.urgent
  property string fontFamily: Style.font.family

  readonly property color dim: Qt.darker(foreground, 1.4)

  width: parent ? parent.width : implicitWidth
  implicitHeight: labels.implicitHeight + Style.space(6) + track.height

  Item {
    id: labels
    width: parent.width
    implicitHeight: Math.max(labelText.implicitHeight, valueText.implicitHeight)

    Text {
      id: labelText
      anchors.left: parent.left
      anchors.verticalCenter: parent.verticalCenter
      text: root.label
      color: root.dim
      font.family: root.fontFamily
      font.pixelSize: Style.font.caption
      font.bold: true
      font.letterSpacing: 1.2
    }

    Text {
      id: valueText
      anchors.right: parent.right
      anchors.verticalCenter: parent.verticalCenter
      text: root.value
      color: root.urgent ? root.urgentColor : root.foreground
      font.family: root.fontFamily
      font.pixelSize: Style.font.body
      font.bold: true

      Behavior on color { ColorAnimation { duration: 160 } }
    }
  }

  Rectangle {
    id: track
    anchors.top: labels.bottom
    anchors.topMargin: Style.space(6)
    width: parent.width
    height: Style.space(4)
    radius: height / 2
    color: Qt.rgba(root.foreground.r, root.foreground.g, root.foreground.b, 0.12)

    Rectangle {
      width: Math.max(0, Math.min(1, root.fraction)) * parent.width
      height: parent.height
      radius: parent.radius
      color: root.urgent ? root.urgentColor : root.foreground

      Behavior on width { NumberAnimation { duration: 260; easing.type: Easing.OutCubic } }
      Behavior on color { ColorAnimation { duration: 160 } }
    }
  }
}
