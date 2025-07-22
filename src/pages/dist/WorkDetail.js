"use strict";
exports.__esModule = true;
var react_1 = require("react");
var WorkDetail_module_css_1 = require("./WorkDetail.module.css");
var WorkIntro_1 = require("../components/WorkIntro");
var ShiftSimulator_1 = require("../components/ShiftSimulator");
var WorkChart_1 = require("../components/WorkChart");
//import ShiftSimulator from '../components/ShiftSimulator';
var ReferenceList_1 = require("../components/ReferenceList");
function Work() {
    return (react_1["default"].createElement("div", { className: WorkDetail_module_css_1["default"].container },
        react_1["default"].createElement("div", { className: WorkDetail_module_css_1["default"].center },
            react_1["default"].createElement("div", { className: WorkDetail_module_css_1["default"].card },
                react_1["default"].createElement(WorkIntro_1["default"], null)),
            react_1["default"].createElement("div", { className: WorkDetail_module_css_1["default"].card },
                react_1["default"].createElement(ShiftSimulator_1["default"], null)),
            react_1["default"].createElement("div", { className: WorkDetail_module_css_1["default"].card },
                react_1["default"].createElement(WorkChart_1["default"], null)),
            react_1["default"].createElement("div", { className: WorkDetail_module_css_1["default"].card },
                react_1["default"].createElement(ReferenceList_1["default"], null)))));
}
exports["default"] = Work;
