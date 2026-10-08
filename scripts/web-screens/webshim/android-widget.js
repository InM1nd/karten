// web-only stub (screenshots): the Android widget library has no web implementation
const React = require("react");
module.exports = {
  registerWidgetTaskHandler: () => {},
  requestWidgetUpdate: () => Promise.resolve(),
  FlexWidget: () => null,
  TextWidget: () => null,
};
