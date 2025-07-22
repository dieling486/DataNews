import React, { useState, useMemo } from 'react';
import ReactECharts from 'echarts-for-react';
// @ts-ignore
import styles from './ShiftSimulator.module.css';

const DEPARTMENTS = [
  { label: 'ICU', value: 'ICU' },
  { label: '普通病房', value: 'Ward' },
  { label: '急诊', value: 'ER' },
];
const STANDARDS = [
  { label: 'WHO', value: 'WHO' },
  { label: 'ICN', value: 'ICN' },
  { label: '中国', value: 'CN' },
];

const STANDARDS_DATA = {
  WHO: { ratio: 4, rest: 12 },
  ICN: { ratio: 5, rest: 11 },
  CN: { ratio: 6, rest: 10 },
};

// 排班数据
const DAYS = ['周一', '周二', '周三', '周四', '周五', '周六', '周日'];
const SHIFTS = [
  { id: 'morning', name: '早班', time: '8:00-16:00' },
  { id: 'evening', name: '晚班', time: '16:00-24:00' },
  { id: 'night', name: '夜班', time: '0:00-8:00' },
];

export default function ShiftSimulator() {
  // 顶部栏状态
  const [week, setWeek] = useState(1);
  const [department, setDepartment] = useState(DEPARTMENTS[0].value);
  const [standard, setStandard] = useState(STANDARDS[0].value);
  const [patientCount, setPatientCount] = useState<number | ''>(12);

  // 护士资源池
  const [nurses, setNurses] = useState([
    { id: 1, name: '护士1' },
    { id: 2, name: '护士2' },
  ]);
  const addNurseToPool = () => {
    const allNursesInSchedule = Object.values(schedule).flat();
    const allNurseIds = [...nurses.map(n => n.id), ...allNursesInSchedule.map(n => n.id)];
    const nextId = allNurseIds.length ? Math.max(...allNurseIds) + 1 : 1;
    setNurses([...nurses, { id: nextId, name: `护士${nextId}` }]);
  };
  const removeNurseFromPool = (id) => setNurses(nurses.filter(n => n.id !== id));

  // 排班表状态 { '周一-morning': [{id: 3, name: '护士3'}] }
  const [schedule, setSchedule] = useState<{ [key: string]: { id: number; name: string }[] }>({});
  const [selectedNurse, setSelectedNurse] = useState<{ id: number; name: string } | null>(null);

  // 计算数据
  const metrics = useMemo(() => {
    // 护士总数 = 资源池护士 + 排班表中所有唯一护士
    const allNurseIds = Array.from(new Set([
      ...nurses.map(n => n.id),
      ...Object.values(schedule).flat().map(n => n.id)
    ]));
    const nurseCount = allNurseIds.length;
    const nursePatientRatio = nurseCount > 0 ? (patientCount || 0) / nurseCount : 0;

    // 日均休息时间
    let totalRest = 0;
    let count = 0;
    for (const nurseId of allNurseIds) {
      for (let dayIdx = 0; dayIdx < DAYS.length; dayIdx++) {
        let restShifts = 0;
        for (let shiftIdx = 0; shiftIdx < SHIFTS.length; shiftIdx++) {
          const slotId = `${DAYS[dayIdx]}-${SHIFTS[shiftIdx].id}`;
          if (!schedule[slotId] || !schedule[slotId].some(n => n.id === nurseId)) {
            restShifts++;
          }
        }
        totalRest += restShifts * 8; // 每班8小时
        count++;
      }
    }
    const avgRestTime = count > 0 ? totalRest / count : 24;

    return {
      nursePatientRatio: nursePatientRatio.toFixed(2),
      avgRestTime: avgRestTime.toFixed(2),
    };
  }, [schedule, patientCount, nurses]);

  const currentStandard = STANDARDS_DATA[standard];

  // 事件
  const prevWeek = () => setWeek(w => Math.max(1, w - 1));
  const nextWeek = () => setWeek(w => w + 1);
  const handleDeptChange = e => setDepartment(e.target.value);
  const handleStdChange = e => setStandard(e.target.value);
  const handlePatientCountChange = e => {
    const value = e.target.value;
    if (value === '') {
      setPatientCount(''); // 删除时允许输入框为空
    } else {
      const count = parseInt(value, 10);
      if (!isNaN(count) && count >= 0) {
        setPatientCount(count); // 只接受非负整数
      }
    }
  };
  const handlePatientCountBlur = () => {
    if (patientCount === '') {
      setPatientCount(0); // 失焦时如果为空则设为0
    }
  };
  const handleSave = () => {
    // 检查周一到周五所有班次是否排满
    let allFilled = true;
    for (let dayIdx = 0; dayIdx < 5; dayIdx++) { // 0-4为周一到周五
      for (let shiftIdx = 0; shiftIdx < SHIFTS.length; shiftIdx++) {
        const slotId = `${DAYS[dayIdx]}-${SHIFTS[shiftIdx].id}`;
        if (!schedule[slotId] || schedule[slotId].length === 0) {
          allFilled = false;
          break;
        }
      }
      if (!allFilled) break;
    }
    if (!allFilled) {
      alert('周一到周五所有班次必须排满！');
      return;
    }
    alert('保存排班（演示）');
  };
  const handleReset = () => {
    setSchedule({});
    setNurses([
      { id: 1, name: '护士1' },
      { id: 2, name: '护士2' },
    ]);
  };
  const handleRandomSchedule = () => {
    // 1. 集中所有护士
    const allNurses = [...nurses, ...Object.values(schedule).flat()];
    let tempSchedule: { [key: string]: { id: number; name: string }[] } = {};
    let nursePool = [...allNurses];
    // 记录已排班护士id，便于池用完时重置
    let usedNurseIds: number[] = [];

    // 2. 先排满周一到周五所有班次
    for (let dayIdx = 0; dayIdx < 5; dayIdx++) {
      for (let shiftIdx = 0; shiftIdx < SHIFTS.length; shiftIdx++) {
        // 池用完就重置（允许同一护士多次排班）
        if (nursePool.length === 0) {
          nursePool = [...allNurses];
        }
        // 随机选一个护士
        let idx = Math.floor(Math.random() * nursePool.length);
        let nurse = nursePool[idx];
        // 检查连续排班
        if (isConsecutive(nurse.id, dayIdx, shiftIdx, tempSchedule)) {
          let found = false;
          for (let tryIdx = 0; tryIdx < nursePool.length; tryIdx++) {
            let tryNurse = nursePool[tryIdx];
            if (!isConsecutive(tryNurse.id, dayIdx, shiftIdx, tempSchedule)) {
              nurse = tryNurse;
              idx = tryIdx;
              found = true;
              break;
            }
          }
          if (!found) {
            // 如果池里都不行，尝试所有护士
            for (let tryIdx = 0; tryIdx < allNurses.length; tryIdx++) {
              let tryNurse = allNurses[tryIdx];
              if (!isConsecutive(tryNurse.id, dayIdx, shiftIdx, tempSchedule)) {
                nurse = tryNurse;
                found = true;
                break;
              }
            }
            if (!found) continue; // 实在排不了
          }
        }
        const slotId = `${DAYS[dayIdx]}-${SHIFTS[shiftIdx].id}`;
        if (!tempSchedule[slotId]) tempSchedule[slotId] = [];
        tempSchedule[slotId].push(nurse);
        // 只从池里移除一次，允许多次分配
        nursePool = nursePool.filter(n => n.id !== nurse.id);
      }
    }
    // 检查周一到周五是否排满
    let allFilled = true;
    for (let dayIdx = 0; dayIdx < 5; dayIdx++) {
      for (let shiftIdx = 0; shiftIdx < SHIFTS.length; shiftIdx++) {
        const slotId = `${DAYS[dayIdx]}-${SHIFTS[shiftIdx].id}`;
        if (!tempSchedule[slotId] || tempSchedule[slotId].length === 0) {
          allFilled = false;
          break;
        }
      }
      if (!allFilled) break;
    }
    if (!allFilled) {
      alert('护士数量不足，无法排满周一到周五所有班次！');
      return;
    }
    // 3. 周末随机排班（可空班，池用完也可重置）
    nursePool = [...allNurses];
    for (let dayIdx = 5; dayIdx < 7; dayIdx++) {
      for (let shiftIdx = 0; shiftIdx < SHIFTS.length; shiftIdx++) {
        if (nursePool.length === 0) nursePool = [...allNurses];
        let idx = Math.floor(Math.random() * nursePool.length);
        let nurse = nursePool[idx];
        if (isConsecutive(nurse.id, dayIdx, shiftIdx, tempSchedule)) {
          let found = false;
          for (let tryIdx = 0; tryIdx < nursePool.length; tryIdx++) {
            let tryNurse = nursePool[tryIdx];
            if (!isConsecutive(tryNurse.id, dayIdx, shiftIdx, tempSchedule)) {
              nurse = tryNurse;
              idx = tryIdx;
              found = true;
              break;
            }
          }
          if (!found) {
            for (let tryIdx = 0; tryIdx < allNurses.length; tryIdx++) {
              let tryNurse = allNurses[tryIdx];
              if (!isConsecutive(tryNurse.id, dayIdx, shiftIdx, tempSchedule)) {
                nurse = tryNurse;
                found = true;
                break;
              }
            }
            if (!found) continue;
          }
        }
        const slotId = `${DAYS[dayIdx]}-${SHIFTS[shiftIdx].id}`;
        if (!tempSchedule[slotId]) tempSchedule[slotId] = [];
        tempSchedule[slotId].push(nurse);
        nursePool = nursePool.filter(n => n.id !== nurse.id);
      }
    }
    setSchedule(tempSchedule);
    setNurses([]);
  };

  // 工具函数：判断是否连续排班
  function isConsecutive(nurseId, dayIdx, shiftIdx, sch = schedule) {
    // 检查前一个班次
    let prevDay = dayIdx, prevShift = shiftIdx - 1;
    if (prevShift < 0) {
      prevDay = dayIdx - 1;
      prevShift = SHIFTS.length - 1;
    }
    if (prevDay >= 0) {
      const prevSlot = `${DAYS[prevDay]}-${SHIFTS[prevShift].id}`;
      if (sch[prevSlot]?.some(n => n.id === nurseId)) return true;
    }
    // 检查后一个班次
    let nextDay = dayIdx, nextShift = shiftIdx + 1;
    if (nextShift >= SHIFTS.length) {
      nextDay = dayIdx + 1;
      nextShift = 0;
    }
    if (nextDay < DAYS.length) {
      const nextSlot = `${DAYS[nextDay]}-${SHIFTS[nextShift].id}`;
      if (sch[nextSlot]?.some(n => n.id === nurseId)) return true;
    }
    return false;
  }

  // 点击事件
  const handleSelectNurse = (nurse) => {
    setSelectedNurse(nurse);
  };
  const handleCellClick = (day, shiftId) => {
    if (selectedNurse) {
      const dayIdx = DAYS.indexOf(day);
      const shiftIdx = SHIFTS.findIndex(s => s.id === shiftId);
      if (isConsecutive(selectedNurse.id, dayIdx, shiftIdx)) {
        alert('护士不能连续排班！');
        return;
      }
      const slotId = `${day}-${shiftId}`;
      const newSchedule = { ...schedule };
      if (!newSchedule[slotId]) newSchedule[slotId] = [];
      // 允许多次排班，不做唯一性检查
      newSchedule[slotId].push(selectedNurse);
      setSchedule(newSchedule);
      removeNurseFromPool(selectedNurse.id);
      setSelectedNurse(null);
    }
  };

  // 拖拽事件
  const handleDragStart = (e, nurse) => {
    e.dataTransfer.setData('nurse', JSON.stringify(nurse));
    setSelectedNurse(null); // 拖拽时清除点击选中
  };
  const handleDragOver = (e) => {
    e.preventDefault();
  };
  const handleDrop = (e, day, shiftId) => {
    e.preventDefault();
    const nurse = JSON.parse(e.dataTransfer.getData('nurse'));
    if (!nurse) return;
    const dayIdx = DAYS.indexOf(day);
    const shiftIdx = SHIFTS.findIndex(s => s.id === shiftId);
    if (isConsecutive(nurse.id, dayIdx, shiftIdx)) {
      alert('护士不能连续排班！');
      return;
    }
    const slotId = `${day}-${shiftId}`;
    const newSchedule = { ...schedule };
    if (!newSchedule[slotId]) newSchedule[slotId] = [];
    newSchedule[slotId].push(nurse);
    setSchedule(newSchedule);
    removeNurseFromPool(nurse.id);
  };

  const removeNurseFromSchedule = (nurseToRemove, day, shiftId) => {
    const slotId = `${day}-${shiftId}`;
    const newSchedule = { ...schedule };
    newSchedule[slotId] = newSchedule[slotId].filter(n => n.id !== nurseToRemove.id);
    setSchedule(newSchedule);
    // 放回资源池并排序
    setNurses(prev => [...prev, nurseToRemove].sort((a, b) => a.id - b.id));
  };

  // 仪表盘 option
  // 计算标准值在仪表盘上的角度和位置
  const min = 0;
  const max = currentStandard.ratio * 2;
  const percent = (currentStandard.ratio - min) / (max - min);
  const angle = 180 - percent * 180; // 仪表盘从180到0度
  const radius = 80; // 相对仪表盘中心的半径，单位为百分比
  // 极坐标转笛卡尔
  const rad = (angle * Math.PI) / 180;
  const x = (radius * Math.cos(rad)) / 100;
  const y = -(radius * Math.sin(rad)) / 100;

  const gaugeOption = {
    series: [
      {
        type: 'gauge',
        startAngle: 180,
        endAngle: 0,
        min,
        max,
        splitNumber: 4,
        radius: '90%',
        axisLine: {
          lineStyle: {
            width: 15,
            color: [
              [0.5, '#4caf50'],
              [0.75, '#ff9800'],
              [1, '#ff4444'],
            ],
          },
        },
        pointer: { show: true, length: '60%', width: 4 },
        axisLabel: {
          distance: 25,
          fontSize: 12,
          color: (value) => {
            if (Math.abs(value - currentStandard.ratio) < 0.01) return '#2563eb';
            return '#666';
          },
          formatter: function(value) {
            if (Math.abs(value - currentStandard.ratio) < 0.01) {
              return '{bold|' + value + '}';
            }
            return value;
          },
          rich: {
            bold: {
              fontWeight: 'bold',
              color: '#2563eb',
              fontSize: 14,
            },
          },
        },
        detail: {
          valueAnimation: true,
          formatter: '1:{value}',
          color: 'auto',
          fontSize: 24,
          offsetCenter: [0, '40%'],
        },
        title: {
          show: true,
          offsetCenter: [x, y - 0.18], // y向上偏移一点，避免与刻度重叠
          fontSize: 14,
          color: '#2563eb',
          fontWeight: 'bold',
        },
        data: [{ value: metrics.nursePatientRatio}],
      },
    ],
  };

  // 柱状图 option
  const barOption = {
    grid: { left: '25%', top: '20%', bottom: '20%', right: '10%' },
    xAxis: { type: 'value', min: 0, max: 24 },
    yAxis: {
      type: 'category',
      data: ['实际', '标准'],
      axisLabel: { fontSize: 14 },
    },
    series: [
      {
        data: [metrics.avgRestTime, currentStandard.rest],
        type: 'bar',
        barWidth: 20,
        itemStyle: {
          color: (params) => (params.dataIndex === 0 ? '#2563eb' : '#4caf50'),
        },
        label: { show: true, position: 'right', formatter: '{c} 小时' },
      },
    ],
  };

  return (
    <div className={styles.simulatorRoot}>
      <div className={styles.topBar}>
        <div className={styles.weekSelector}>
          <button onClick={prevWeek} className={styles.weekBtn}>{'<'}</button>
          <span className={styles.weekLabel}>第 {week} 周</span>
          <button onClick={nextWeek} className={styles.weekBtn}>{'>'}</button>
        </div>
        <div className={styles.deptSelector}>
          <label className={styles.stdLabel}>科室</label>
          <select value={department} onChange={handleDeptChange} className={styles.deptSelect}>
            {DEPARTMENTS.map(d => (
              <option key={d.value} value={d.value}>{d.label}</option>
            ))}
          </select>
        </div>
        <div className={styles.stdSwitcher}>
          <label className={styles.stdLabel}>标准</label>
          <select value={standard} onChange={handleStdChange} className={styles.stdSelect}>
            {STANDARDS.map(s => (
              <option key={s.value} value={s.value}>{s.label}</option>
            ))}
          </select>
        </div>
        <div className={styles.patientCountSelector}>
          <label className={styles.stdLabel}>患者人数</label>
          <input
            type="number"
            value={patientCount}
            onChange={handlePatientCountChange}
            onBlur={handlePatientCountBlur}
            className={styles.patientCountInput}
            min="0"
          />
        </div>
        <div className={styles.actionBtns}>
          <button className={styles.randomBtn} onClick={handleRandomSchedule}>随机排班</button>
          <button className={styles.saveBtn} onClick={handleSave}>保存排班</button>
          <button className={styles.resetBtn} onClick={handleReset}>重置排班</button>
        </div>
      </div>
      <div className={styles.mainArea}>
        <div className={styles.leftPanel}>
          <div className={styles.panelTitle}>护士资源池</div>
          <div className={styles.nurseList}>
            {nurses.map(nurse => (
              <div
                key={nurse.id}
                className={`${styles.nurseCard} ${selectedNurse?.id === nurse.id ? styles.nurseCardSelected : ''}`}
                draggable
                onDragStart={e => handleDragStart(e, nurse)}
                onClick={() => handleSelectNurse(nurse)}
              >
                <span className={styles.nurseName}>{nurse.name}</span>
              </div>
            ))}
            <button className={styles.addNurseBtn} onClick={addNurseToPool}>+ 添加护士</button>
          </div>
        </div>
        <div className={styles.centerPanel}>
          <div className={styles.panelTitle}>排班表</div>
          <div className={styles.scheduleMatrix}>
            <div className={styles.scheduleHeader}>班次/日期</div>
            {DAYS.map(day => (
              <div key={day} className={styles.scheduleHeader}>{day}</div>
            ))}
            {SHIFTS.map(shift => (
              <React.Fragment key={shift.id}>
                <div className={`${styles.scheduleCell} ${styles.shiftHeader}`}>
                  <div className={styles.shiftName}>{shift.name}</div>
                  <div className={styles.shiftTime}>{shift.time}</div>
                </div>
                {DAYS.map(day => (
                  <div
                    key={`${day}-${shift.id}`}
                    className={styles.scheduleCell}
                    onDragOver={handleDragOver}
                    onDrop={e => handleDrop(e, day, shift.id)}
                    onClick={() => handleCellClick(day, shift.id)}
                  >
                    {schedule[`${day}-${shift.id}`]?.map(nurse => (
                      <div key={nurse.id} className={styles.assignedNurse}>
                        {nurse.name}
                        <button onClick={() => removeNurseFromSchedule(nurse, day, shift.id)} className={styles.removeNurseBtn}>×</button>
                      </div>
                    ))}
                  </div>
                ))}
              </React.Fragment>
            ))}
          </div>
        </div>
        <div className={styles.rightPanel}>
          <div className={styles.panelTitle}>数据看板</div>
          <div className={styles.dashboard}>
            <div className={styles.chartContainer}>
              <h4 className={styles.chartTitle}>护患比</h4>
              <div className={styles.gaugeStandardText}>标准</div>
              <ReactECharts option={gaugeOption} style={{ height: 180 }} />
            </div>
            <div className={styles.chartContainer}>
              <h4 className={styles.chartTitle}>平均休息时间</h4>
              <ReactECharts option={barOption} style={{ height: 180 }} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
