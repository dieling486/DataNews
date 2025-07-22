"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
var __spreadArrays = (this && this.__spreadArrays) || function () {
    for (var s = 0, i = 0, il = arguments.length; i < il; i++) s += arguments[i].length;
    for (var r = Array(s), k = 0, i = 0; i < il; i++)
        for (var a = arguments[i], j = 0, jl = a.length; j < jl; j++, k++)
            r[k] = a[j];
    return r;
};
exports.__esModule = true;
var react_1 = require("react");
var echarts_for_react_1 = require("echarts-for-react");
// @ts-ignore
var ShiftSimulator_module_css_1 = require("./ShiftSimulator.module.css");
var DEPARTMENTS = [
    { label: 'ICU', value: 'ICU' },
    { label: '普通病房', value: 'Ward' },
    { label: '急诊', value: 'ER' },
];
var STANDARDS = [
    { label: 'WHO', value: 'WHO' },
    { label: 'ICN', value: 'ICN' },
    { label: '中国', value: 'CN' },
];
var STANDARDS_DATA = {
    WHO: { ratio: 4, rest: 12 },
    ICN: { ratio: 5, rest: 11 },
    CN: { ratio: 6, rest: 10 }
};
// 排班数据
var DAYS = ['周一', '周二', '周三', '周四', '周五', '周六', '周日'];
var SHIFTS = [
    { id: 'morning', name: '早班', time: '8:00-16:00' },
    { id: 'evening', name: '晚班', time: '16:00-24:00' },
    { id: 'night', name: '夜班', time: '0:00-8:00' },
];
function ShiftSimulator() {
    // 顶部栏状态
    var _a = react_1.useState(1), week = _a[0], setWeek = _a[1];
    var _b = react_1.useState(DEPARTMENTS[0].value), department = _b[0], setDepartment = _b[1];
    var _c = react_1.useState(STANDARDS[0].value), standard = _c[0], setStandard = _c[1];
    var _d = react_1.useState(12), patientCount = _d[0], setPatientCount = _d[1];
    // 护士资源池
    var _e = react_1.useState([
        { id: 1, name: '护士1' },
        { id: 2, name: '护士2' },
    ]), nurses = _e[0], setNurses = _e[1];
    var addNurseToPool = function () {
        var allNursesInSchedule = Object.values(schedule).flat();
        var allNurseIds = __spreadArrays(nurses.map(function (n) { return n.id; }), allNursesInSchedule.map(function (n) { return n.id; }));
        var nextId = allNurseIds.length ? Math.max.apply(Math, allNurseIds) + 1 : 1;
        setNurses(__spreadArrays(nurses, [{ id: nextId, name: "\u62A4\u58EB" + nextId }]));
    };
    var removeNurseFromPool = function (id) { return setNurses(nurses.filter(function (n) { return n.id !== id; })); };
    // 排班表状态 { '周一-morning': [{id: 3, name: '护士3'}] }
    var _f = react_1.useState({}), schedule = _f[0], setSchedule = _f[1];
    var _g = react_1.useState(null), selectedNurse = _g[0], setSelectedNurse = _g[1];
    // 计算数据
    var metrics = react_1.useMemo(function () {
        var totalNursesInSchedule = Object.values(schedule).flat().length;
        // 护患比 = 患者数 / 护士数
        var nursePatientRatio = totalNursesInSchedule > 0 ? (patientCount || 0) / totalNursesInSchedule : 0;
        // 日均休息时间
        var allNurseIds = Array.from(new Set(__spreadArrays(nurses.map(function (n) { return n.id; }), Object.values(schedule).flat().map(function (n) { return n.id; }))));
        var totalRest = 0;
        var count = 0;
        var _loop_1 = function (nurseId) {
            for (var dayIdx = 0; dayIdx < DAYS.length; dayIdx++) {
                var restShifts = 0;
                for (var shiftIdx = 0; shiftIdx < SHIFTS.length; shiftIdx++) {
                    var slotId = DAYS[dayIdx] + "-" + SHIFTS[shiftIdx].id;
                    if (!schedule[slotId] || !schedule[slotId].some(function (n) { return n.id === nurseId; })) {
                        restShifts++;
                    }
                }
                totalRest += restShifts * 8; // 每班8小时
                count++;
            }
        };
        for (var _i = 0, allNurseIds_1 = allNurseIds; _i < allNurseIds_1.length; _i++) {
            var nurseId = allNurseIds_1[_i];
            _loop_1(nurseId);
        }
        var avgRestTime = count > 0 ? totalRest / count : 24;
        return {
            nursePatientRatio: nursePatientRatio.toFixed(2),
            avgRestTime: avgRestTime.toFixed(2)
        };
    }, [schedule, patientCount, nurses]);
    var currentStandard = STANDARDS_DATA[standard];
    // 事件
    var prevWeek = function () { return setWeek(function (w) { return Math.max(1, w - 1); }); };
    var nextWeek = function () { return setWeek(function (w) { return w + 1; }); };
    var handleDeptChange = function (e) { return setDepartment(e.target.value); };
    var handleStdChange = function (e) { return setStandard(e.target.value); };
    var handlePatientCountChange = function (e) {
        var value = e.target.value;
        if (value === '') {
            setPatientCount(''); // 删除时允许输入框为空
        }
        else {
            var count = parseInt(value, 10);
            if (!isNaN(count) && count >= 0) {
                setPatientCount(count); // 只接受非负整数
            }
        }
    };
    var handlePatientCountBlur = function () {
        if (patientCount === '') {
            setPatientCount(0); // 失焦时如果为空则设为0
        }
    };
    var handleSave = function () {
        // 检查周一到周五所有班次是否排满
        var allFilled = true;
        for (var dayIdx = 0; dayIdx < 5; dayIdx++) { // 0-4为周一到周五
            for (var shiftIdx = 0; shiftIdx < SHIFTS.length; shiftIdx++) {
                var slotId = DAYS[dayIdx] + "-" + SHIFTS[shiftIdx].id;
                if (!schedule[slotId] || schedule[slotId].length === 0) {
                    allFilled = false;
                    break;
                }
            }
            if (!allFilled)
                break;
        }
        if (!allFilled) {
            alert('周一到周五所有班次必须排满！');
            return;
        }
        alert('保存排班（演示）');
    };
    var handleReset = function () {
        setSchedule({});
        setNurses([
            { id: 1, name: '护士1' },
            { id: 2, name: '护士2' },
        ]);
    };
    var handleRandomSchedule = function () {
        // 1. 集中所有护士
        var allNurses = __spreadArrays(nurses, Object.values(schedule).flat());
        var tempSchedule = {};
        var nursePool = __spreadArrays(allNurses);
        // 记录已排班护士id，便于池用完时重置
        var usedNurseIds = [];
        // 2. 先排满周一到周五所有班次
        for (var dayIdx = 0; dayIdx < 5; dayIdx++) {
            var _loop_2 = function (shiftIdx) {
                // 池用完就重置（允许同一护士多次排班）
                if (nursePool.length === 0) {
                    nursePool = __spreadArrays(allNurses);
                }
                // 随机选一个护士
                var idx = Math.floor(Math.random() * nursePool.length);
                var nurse = nursePool[idx];
                // 检查连续排班
                if (isConsecutive(nurse.id, dayIdx, shiftIdx, tempSchedule)) {
                    var found = false;
                    for (var tryIdx = 0; tryIdx < nursePool.length; tryIdx++) {
                        var tryNurse = nursePool[tryIdx];
                        if (!isConsecutive(tryNurse.id, dayIdx, shiftIdx, tempSchedule)) {
                            nurse = tryNurse;
                            idx = tryIdx;
                            found = true;
                            break;
                        }
                    }
                    if (!found) {
                        // 如果池里都不行，尝试所有护士
                        for (var tryIdx = 0; tryIdx < allNurses.length; tryIdx++) {
                            var tryNurse = allNurses[tryIdx];
                            if (!isConsecutive(tryNurse.id, dayIdx, shiftIdx, tempSchedule)) {
                                nurse = tryNurse;
                                found = true;
                                break;
                            }
                        }
                        if (!found)
                            return "continue"; // 实在排不了
                    }
                }
                var slotId = DAYS[dayIdx] + "-" + SHIFTS[shiftIdx].id;
                if (!tempSchedule[slotId])
                    tempSchedule[slotId] = [];
                tempSchedule[slotId].push(nurse);
                // 只从池里移除一次，允许多次分配
                nursePool = nursePool.filter(function (n) { return n.id !== nurse.id; });
            };
            for (var shiftIdx = 0; shiftIdx < SHIFTS.length; shiftIdx++) {
                _loop_2(shiftIdx);
            }
        }
        // 检查周一到周五是否排满
        var allFilled = true;
        for (var dayIdx = 0; dayIdx < 5; dayIdx++) {
            for (var shiftIdx = 0; shiftIdx < SHIFTS.length; shiftIdx++) {
                var slotId = DAYS[dayIdx] + "-" + SHIFTS[shiftIdx].id;
                if (!tempSchedule[slotId] || tempSchedule[slotId].length === 0) {
                    allFilled = false;
                    break;
                }
            }
            if (!allFilled)
                break;
        }
        if (!allFilled) {
            alert('护士数量不足，无法排满周一到周五所有班次！');
            return;
        }
        // 3. 周末随机排班（可空班，池用完也可重置）
        nursePool = __spreadArrays(allNurses);
        for (var dayIdx = 5; dayIdx < 7; dayIdx++) {
            var _loop_3 = function (shiftIdx) {
                if (nursePool.length === 0)
                    nursePool = __spreadArrays(allNurses);
                var idx = Math.floor(Math.random() * nursePool.length);
                var nurse = nursePool[idx];
                if (isConsecutive(nurse.id, dayIdx, shiftIdx, tempSchedule)) {
                    var found = false;
                    for (var tryIdx = 0; tryIdx < nursePool.length; tryIdx++) {
                        var tryNurse = nursePool[tryIdx];
                        if (!isConsecutive(tryNurse.id, dayIdx, shiftIdx, tempSchedule)) {
                            nurse = tryNurse;
                            idx = tryIdx;
                            found = true;
                            break;
                        }
                    }
                    if (!found) {
                        for (var tryIdx = 0; tryIdx < allNurses.length; tryIdx++) {
                            var tryNurse = allNurses[tryIdx];
                            if (!isConsecutive(tryNurse.id, dayIdx, shiftIdx, tempSchedule)) {
                                nurse = tryNurse;
                                found = true;
                                break;
                            }
                        }
                        if (!found)
                            return "continue";
                    }
                }
                var slotId = DAYS[dayIdx] + "-" + SHIFTS[shiftIdx].id;
                if (!tempSchedule[slotId])
                    tempSchedule[slotId] = [];
                tempSchedule[slotId].push(nurse);
                nursePool = nursePool.filter(function (n) { return n.id !== nurse.id; });
            };
            for (var shiftIdx = 0; shiftIdx < SHIFTS.length; shiftIdx++) {
                _loop_3(shiftIdx);
            }
        }
        setSchedule(tempSchedule);
        setNurses([]);
    };
    // 工具函数：判断是否连续排班
    function isConsecutive(nurseId, dayIdx, shiftIdx, sch) {
        var _a, _b;
        if (sch === void 0) { sch = schedule; }
        // 检查前一个班次
        var prevDay = dayIdx, prevShift = shiftIdx - 1;
        if (prevShift < 0) {
            prevDay = dayIdx - 1;
            prevShift = SHIFTS.length - 1;
        }
        if (prevDay >= 0) {
            var prevSlot = DAYS[prevDay] + "-" + SHIFTS[prevShift].id;
            if ((_a = sch[prevSlot]) === null || _a === void 0 ? void 0 : _a.some(function (n) { return n.id === nurseId; }))
                return true;
        }
        // 检查后一个班次
        var nextDay = dayIdx, nextShift = shiftIdx + 1;
        if (nextShift >= SHIFTS.length) {
            nextDay = dayIdx + 1;
            nextShift = 0;
        }
        if (nextDay < DAYS.length) {
            var nextSlot = DAYS[nextDay] + "-" + SHIFTS[nextShift].id;
            if ((_b = sch[nextSlot]) === null || _b === void 0 ? void 0 : _b.some(function (n) { return n.id === nurseId; }))
                return true;
        }
        return false;
    }
    // 点击事件
    var handleSelectNurse = function (nurse) {
        setSelectedNurse(nurse);
    };
    var handleCellClick = function (day, shiftId) {
        if (selectedNurse) {
            var dayIdx = DAYS.indexOf(day);
            var shiftIdx = SHIFTS.findIndex(function (s) { return s.id === shiftId; });
            if (isConsecutive(selectedNurse.id, dayIdx, shiftIdx)) {
                alert('护士不能连续排班！');
                return;
            }
            var slotId = day + "-" + shiftId;
            var newSchedule = __assign({}, schedule);
            if (!newSchedule[slotId])
                newSchedule[slotId] = [];
            // 允许多次排班，不做唯一性检查
            newSchedule[slotId].push(selectedNurse);
            setSchedule(newSchedule);
            removeNurseFromPool(selectedNurse.id);
            setSelectedNurse(null);
        }
    };
    // 拖拽事件
    var handleDragStart = function (e, nurse) {
        e.dataTransfer.setData('nurse', JSON.stringify(nurse));
        setSelectedNurse(null); // 拖拽时清除点击选中
    };
    var handleDragOver = function (e) {
        e.preventDefault();
    };
    var handleDrop = function (e, day, shiftId) {
        e.preventDefault();
        var nurse = JSON.parse(e.dataTransfer.getData('nurse'));
        if (!nurse)
            return;
        var dayIdx = DAYS.indexOf(day);
        var shiftIdx = SHIFTS.findIndex(function (s) { return s.id === shiftId; });
        if (isConsecutive(nurse.id, dayIdx, shiftIdx)) {
            alert('护士不能连续排班！');
            return;
        }
        var slotId = day + "-" + shiftId;
        var newSchedule = __assign({}, schedule);
        if (!newSchedule[slotId])
            newSchedule[slotId] = [];
        newSchedule[slotId].push(nurse);
        setSchedule(newSchedule);
        removeNurseFromPool(nurse.id);
    };
    var removeNurseFromSchedule = function (nurseToRemove, day, shiftId) {
        var slotId = day + "-" + shiftId;
        var newSchedule = __assign({}, schedule);
        newSchedule[slotId] = newSchedule[slotId].filter(function (n) { return n.id !== nurseToRemove.id; });
        setSchedule(newSchedule);
        // 放回资源池并排序
        setNurses(function (prev) { return __spreadArrays(prev, [nurseToRemove]).sort(function (a, b) { return a.id - b.id; }); });
    };
    // 仪表盘 option
    // 计算标准值在仪表盘上的角度和位置
    var min = 0;
    var max = currentStandard.ratio * 2;
    var percent = (currentStandard.ratio - min) / (max - min);
    var angle = 180 - percent * 180; // 仪表盘从180到0度
    var radius = 80; // 相对仪表盘中心的半径，单位为百分比
    // 极坐标转笛卡尔
    var rad = (angle * Math.PI) / 180;
    var x = (radius * Math.cos(rad)) / 100;
    var y = -(radius * Math.sin(rad)) / 100;
    var gaugeOption = {
        series: [
            {
                type: 'gauge',
                startAngle: 180,
                endAngle: 0,
                min: min,
                max: max,
                splitNumber: 4,
                radius: '90%',
                axisLine: {
                    lineStyle: {
                        width: 15,
                        color: [
                            [0.5, '#4caf50'],
                            [0.75, '#ff9800'],
                            [1, '#ff4444'],
                        ]
                    }
                },
                pointer: { show: true, length: '60%', width: 4 },
                axisLabel: {
                    distance: 25,
                    fontSize: 12,
                    color: function (value) {
                        if (Math.abs(value - currentStandard.ratio) < 0.01)
                            return '#2563eb';
                        return '#666';
                    },
                    formatter: function (value) {
                        if (Math.abs(value - currentStandard.ratio) < 0.01) {
                            return '{bold|' + value + '}';
                        }
                        return value;
                    },
                    rich: {
                        bold: {
                            fontWeight: 'bold',
                            color: '#2563eb',
                            fontSize: 14
                        }
                    }
                },
                detail: {
                    valueAnimation: true,
                    formatter: '1:{value}',
                    color: 'auto',
                    fontSize: 24,
                    offsetCenter: [0, '40%']
                },
                title: {
                    show: true,
                    offsetCenter: [x, y - 0.18],
                    fontSize: 14,
                    color: '#2563eb',
                    fontWeight: 'bold'
                },
                data: [{ value: metrics.nursePatientRatio }]
            },
        ]
    };
    // 柱状图 option
    var barOption = {
        grid: { left: '25%', top: '20%', bottom: '20%', right: '10%' },
        xAxis: { type: 'value', min: 0, max: 24 },
        yAxis: {
            type: 'category',
            data: ['实际', '标准'],
            axisLabel: { fontSize: 14 }
        },
        series: [
            {
                data: [metrics.avgRestTime, currentStandard.rest],
                type: 'bar',
                barWidth: 20,
                itemStyle: {
                    color: function (params) { return (params.dataIndex === 0 ? '#2563eb' : '#4caf50'); }
                },
                label: { show: true, position: 'right', formatter: '{c} 小时' }
            },
        ]
    };
    return (react_1["default"].createElement("div", { className: ShiftSimulator_module_css_1["default"].simulatorRoot },
        react_1["default"].createElement("div", { className: ShiftSimulator_module_css_1["default"].topBar },
            react_1["default"].createElement("div", { className: ShiftSimulator_module_css_1["default"].weekSelector },
                react_1["default"].createElement("button", { onClick: prevWeek, className: ShiftSimulator_module_css_1["default"].weekBtn }, '<'),
                react_1["default"].createElement("span", { className: ShiftSimulator_module_css_1["default"].weekLabel },
                    "\u7B2C ",
                    week,
                    " \u5468"),
                react_1["default"].createElement("button", { onClick: nextWeek, className: ShiftSimulator_module_css_1["default"].weekBtn }, '>')),
            react_1["default"].createElement("div", { className: ShiftSimulator_module_css_1["default"].deptSelector },
                react_1["default"].createElement("label", { className: ShiftSimulator_module_css_1["default"].stdLabel }, "\u79D1\u5BA4"),
                react_1["default"].createElement("select", { value: department, onChange: handleDeptChange, className: ShiftSimulator_module_css_1["default"].deptSelect }, DEPARTMENTS.map(function (d) { return (react_1["default"].createElement("option", { key: d.value, value: d.value }, d.label)); }))),
            react_1["default"].createElement("div", { className: ShiftSimulator_module_css_1["default"].stdSwitcher },
                react_1["default"].createElement("label", { className: ShiftSimulator_module_css_1["default"].stdLabel }, "\u6807\u51C6"),
                react_1["default"].createElement("select", { value: standard, onChange: handleStdChange, className: ShiftSimulator_module_css_1["default"].stdSelect }, STANDARDS.map(function (s) { return (react_1["default"].createElement("option", { key: s.value, value: s.value }, s.label)); }))),
            react_1["default"].createElement("div", { className: ShiftSimulator_module_css_1["default"].patientCountSelector },
                react_1["default"].createElement("label", { className: ShiftSimulator_module_css_1["default"].stdLabel }, "\u60A3\u8005\u4EBA\u6570"),
                react_1["default"].createElement("input", { type: "number", value: patientCount, onChange: handlePatientCountChange, onBlur: handlePatientCountBlur, className: ShiftSimulator_module_css_1["default"].patientCountInput, min: "0" })),
            react_1["default"].createElement("div", { className: ShiftSimulator_module_css_1["default"].actionBtns },
                react_1["default"].createElement("button", { className: ShiftSimulator_module_css_1["default"].randomBtn, onClick: handleRandomSchedule }, "\u968F\u673A\u6392\u73ED"),
                react_1["default"].createElement("button", { className: ShiftSimulator_module_css_1["default"].saveBtn, onClick: handleSave }, "\u4FDD\u5B58\u6392\u73ED"),
                react_1["default"].createElement("button", { className: ShiftSimulator_module_css_1["default"].resetBtn, onClick: handleReset }, "\u91CD\u7F6E\u6392\u73ED"))),
        react_1["default"].createElement("div", { className: ShiftSimulator_module_css_1["default"].mainArea },
            react_1["default"].createElement("div", { className: ShiftSimulator_module_css_1["default"].leftPanel },
                react_1["default"].createElement("div", { className: ShiftSimulator_module_css_1["default"].panelTitle }, "\u62A4\u58EB\u8D44\u6E90\u6C60"),
                react_1["default"].createElement("div", { className: ShiftSimulator_module_css_1["default"].nurseList },
                    nurses.map(function (nurse) { return (react_1["default"].createElement("div", { key: nurse.id, className: ShiftSimulator_module_css_1["default"].nurseCard + " " + ((selectedNurse === null || selectedNurse === void 0 ? void 0 : selectedNurse.id) === nurse.id ? ShiftSimulator_module_css_1["default"].nurseCardSelected : ''), draggable: true, onDragStart: function (e) { return handleDragStart(e, nurse); }, onClick: function () { return handleSelectNurse(nurse); } },
                        react_1["default"].createElement("span", { className: ShiftSimulator_module_css_1["default"].nurseName }, nurse.name))); }),
                    react_1["default"].createElement("button", { className: ShiftSimulator_module_css_1["default"].addNurseBtn, onClick: addNurseToPool }, "+ \u6DFB\u52A0\u62A4\u58EB"))),
            react_1["default"].createElement("div", { className: ShiftSimulator_module_css_1["default"].centerPanel },
                react_1["default"].createElement("div", { className: ShiftSimulator_module_css_1["default"].panelTitle }, "\u6392\u73ED\u8868"),
                react_1["default"].createElement("div", { className: ShiftSimulator_module_css_1["default"].scheduleMatrix },
                    react_1["default"].createElement("div", { className: ShiftSimulator_module_css_1["default"].scheduleHeader }, "\u73ED\u6B21/\u65E5\u671F"),
                    DAYS.map(function (day) { return (react_1["default"].createElement("div", { key: day, className: ShiftSimulator_module_css_1["default"].scheduleHeader }, day)); }),
                    SHIFTS.map(function (shift) { return (react_1["default"].createElement(react_1["default"].Fragment, { key: shift.id },
                        react_1["default"].createElement("div", { className: ShiftSimulator_module_css_1["default"].scheduleCell + " " + ShiftSimulator_module_css_1["default"].shiftHeader },
                            react_1["default"].createElement("div", { className: ShiftSimulator_module_css_1["default"].shiftName }, shift.name),
                            react_1["default"].createElement("div", { className: ShiftSimulator_module_css_1["default"].shiftTime }, shift.time)),
                        DAYS.map(function (day) {
                            var _a;
                            return (react_1["default"].createElement("div", { key: day + "-" + shift.id, className: ShiftSimulator_module_css_1["default"].scheduleCell, onDragOver: handleDragOver, onDrop: function (e) { return handleDrop(e, day, shift.id); }, onClick: function () { return handleCellClick(day, shift.id); } }, (_a = schedule[day + "-" + shift.id]) === null || _a === void 0 ? void 0 : _a.map(function (nurse) { return (react_1["default"].createElement("div", { key: nurse.id, className: ShiftSimulator_module_css_1["default"].assignedNurse },
                                nurse.name,
                                react_1["default"].createElement("button", { onClick: function () { return removeNurseFromSchedule(nurse, day, shift.id); }, className: ShiftSimulator_module_css_1["default"].removeNurseBtn }, "\u00D7"))); })));
                        }))); }))),
            react_1["default"].createElement("div", { className: ShiftSimulator_module_css_1["default"].rightPanel },
                react_1["default"].createElement("div", { className: ShiftSimulator_module_css_1["default"].panelTitle }, "\u6570\u636E\u770B\u677F"),
                react_1["default"].createElement("div", { className: ShiftSimulator_module_css_1["default"].dashboard },
                    react_1["default"].createElement("div", { className: ShiftSimulator_module_css_1["default"].chartContainer },
                        react_1["default"].createElement("h4", { className: ShiftSimulator_module_css_1["default"].chartTitle }, "\u62A4\u60A3\u6BD4"),
                        react_1["default"].createElement("div", { className: ShiftSimulator_module_css_1["default"].gaugeStandardText }, "\u6807\u51C6"),
                        react_1["default"].createElement(echarts_for_react_1["default"], { option: gaugeOption, style: { height: 180 } })),
                    react_1["default"].createElement("div", { className: ShiftSimulator_module_css_1["default"].chartContainer },
                        react_1["default"].createElement("h4", { className: ShiftSimulator_module_css_1["default"].chartTitle }, "\u5E73\u5747\u4F11\u606F\u65F6\u95F4"),
                        react_1["default"].createElement(echarts_for_react_1["default"], { option: barOption, style: { height: 180 } })))))));
}
exports["default"] = ShiftSimulator;
