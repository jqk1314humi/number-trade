// ==================== 产品数据定义 ====================
const products = [
    { name: '座椅', unitPrice: 750, volCoef: 124000, weightCoef: 6, isSpecial: false },
    { name: '车', unitPrice: 500, volCoef: 4500, weightCoef: 0.85, isSpecial: false },
    { name: '狗', unitPrice: 440, volCoef: 1000, weightCoef: 0.2, isSpecial: false },
    { name: '螺蛳粉', unitPrice: 35, volCoef: 120, weightCoef: 0.1, isSpecial: false },
    { name: '冷面', unitPrice: 42, volCoef: 120, weightCoef: 0.1, isSpecial: false },
    { name: '馒头', unitPrice: 25, volCoef: 100, weightCoef: 0.08, isSpecial: false },
    { name: 'T恤', unitPrice: 128, volCoef: 500, weightCoef: 0.15, isSpecial: false },
    { name: '衬衫', unitPrice: 169, volCoef: 500, weightCoef: 0.2, isSpecial: false },
    { name: '皮衣', unitPrice: 198, volCoef: 1000, weightCoef: 0.8, isSpecial: false },
    { name: '电视', unitPrice: 3499, volCoef: 150000, weightCoef: 9, isSpecial: false },
    { name: '消毒', unitPrice: 218, volCoef: 30000, weightCoef: 5, isSpecial: false },
    { name: '吸尘', unitPrice: 499, volCoef: 40000, weightCoef: 1.5, isSpecial: false },
    { name: '7000', unitPrice: 8699, volCoef: 4000, weightCoef: 2.5, isSpecial: true },
    { name: '学习', unitPrice: 5200, volCoef: 3000, weightCoef: 1.8, isSpecial: true },
    { name: '尼康', unitPrice: 6199, volCoef: 1260, weightCoef: 2, isSpecial: true },
];

// 默认市场数据：全部总需求为0，倍率为1
const defaultMarketData = products.map(() => ({
    taohuo: 0,
    global: 0,
    yinfu: 0,
    rate: 1
}));

let marketData = JSON.parse(JSON.stringify(defaultMarketData));

// 推荐方案映射 (年份,季度) -> 方案编号(1,2,3)
const recommendMap = {
    '1,1': 1,
    '1,2': 3,
    '1,3': 2,
    '1,4': 3,
    '2,1': 2,
    '2,2': 3,
    '2,3': 2,
    '2,4': 3,
    '3,1': 2,
    '3,2': 3,
    '3,3': 2,
    '3,4': 3,
    '4,1': 2,
    '4,2': 3,
    '4,3': 2,
    '4,4': 3
};

// 提醒弹窗映射
const reminderMessages = {
    '1,4': '📢 请注意：第1年第4季度，需要入驻京西平台！',
    '2,2': '📢 请注意：第2年第2季度，需要续费淘货服务！',
    '2,4': '📢 请注意：第2年第4季度，需要续费京西平台！',
    '3,1': '📢 请注意：第3年第1季度，需要入驻音符直播！',
    '3,2': '📢 请注意：第3年第2季度，需要续费淘货服务！',
    '3,4': '📢 请注意：第3年第4季度，需要续费京西平台！',
    '4,2': '📢 请注意：第4年第2季度，需要续费淘货服务！',
    '4,4': '📢 请注意：第4年第4季度，需要续费京西平台！',
};

let lastReminderKey = null;

function getRecommendMethod() {
    const year = document.getElementById('currentYear').value;
    const quarter = document.getElementById('currentQuarter').value;
    return recommendMap[`${year},${quarter}`] || 3;
}

function triggerReminder() {
    const year = document.getElementById('currentYear').value;
    const quarter = document.getElementById('currentQuarter').value;
    const key = `${year},${quarter}`;
    const msg = reminderMessages[key];
    if (msg && key !== lastReminderKey) {
        document.getElementById('reminderMessage').innerHTML = msg;
        document.getElementById('reminderModal').style.display = 'flex';
        lastReminderKey = key;
    }
}

function onYearChange() {
    document.getElementById('currentQuarter').value = '1';
    onYearQuarterChange();
}

function onYearQuarterChange() {
    document.getElementById('isOrderActive').value = '0';
    triggerReminder();
    updateAll();
}

function closeModal() {
    document.getElementById('reminderModal').style.display = 'none';
}

function init() {
    buildMarketTable();
    document.getElementById('isOrderActive').value = '0';
    updateAll();
    triggerReminder();
    attachEvents();
}

function attachEvents() {
    document.getElementById('currentYear').addEventListener('change', onYearChange);
    document.getElementById('currentQuarter').addEventListener('change', onYearQuarterChange);
    document.getElementById('isOrderActive').addEventListener('change', updateAll);
    document.getElementById('expectedBudget').addEventListener('change', updateAll);
    document.getElementById('exchangeRate').addEventListener('change', updateAll);
    document.getElementById('tariffRate').addEventListener('change', updateAll);
    document.getElementById('taohuoPeople').addEventListener('change', function() { syncPeople('taohuo'); });
    document.getElementById('globalPeople').addEventListener('change', function() { syncPeople('global'); });
    document.getElementById('yinFuPeople').addEventListener('change', function() { syncPeople('yinfu'); });
    document.getElementById('crossBorderBudgetMode').addEventListener('change', updateCrossBorder);
    document.getElementById('resetMarketBtn').addEventListener('click', resetMarketData);
    document.getElementById('closeModalBtn').addEventListener('click', closeModal);

    // 特殊计算器输入绑定
    const specialInputs = [
        'dogExisting', 'dogDemand', 'dogExpected',
        'carExisting', 'carDemand', 'carExpected',
        'seatExisting', 'seatDemand', 'seatExpected'
    ];
    specialInputs.forEach(id => {
        const el = document.getElementById(id);
        if (el) el.addEventListener('change', updateSpecialCalc);
    });
}

function buildMarketTable() {
    const tbody = document.getElementById('marketTableBody');
    tbody.innerHTML = products.map((p, i) => {
        const md = marketData[i];
        return `
        <tr>
            <td style="font-weight:700;">${p.name}</td>
            <td><input type="number" id="taohuo_${i}" value="${md.taohuo}" min="0"></td>
            <td class="result-cell" id="taohuoExp_${i}">-</td>
            <td><input type="number" id="global_${i}" value="${md.global}" min="0"></td>
            <td class="result-cell" id="globalExp_${i}">-</td>
            <td><input type="number" id="yinfu_${i}" value="${md.yinfu}" min="0"></td>
            <td class="result-cell" id="yinfuExp_${i}">-</td>
            <td style="font-weight:600;">${p.unitPrice}</td>
            <td><input type="number" id="rate_${i}" value="${md.rate}" step="0.01" min="0.01" style="width:80px;"></td>
        </tr>`;
    }).join('');

    // 绑定表格内输入框的事件（事件委托）
    tbody.addEventListener('change', function(e) {
        if (e.target.tagName === 'INPUT') {
            const id = e.target.id;
            if (id.startsWith('taohuo_')) updateMarketData(parseInt(id.split('_')[1]), 'taohuo');
            else if (id.startsWith('global_')) updateMarketData(parseInt(id.split('_')[1]), 'global');
            else if (id.startsWith('yinfu_')) updateMarketData(parseInt(id.split('_')[1]), 'yinfu');
            else if (id.startsWith('rate_')) updateMarketData(parseInt(id.split('_')[1]), 'rate');
        }
    });
}

function updateMarketData(index, field) {
    const input = document.getElementById(`${field}_${index}`);
    const val = parseFloat(input?.value) || 0;
    marketData[index][field] = val;
    updateAll();
}

function syncPeople(source) {
    const val = document.getElementById(source === 'taohuo' ? 'taohuoPeople' : source === 'global' ? 'globalPeople' : 'yinFuPeople').value;
    if (source === 'taohuo') {
        document.getElementById('globalPeople').value = val;
        document.getElementById('yinFuPeople').value = val;
    } else if (source === 'global') {
        document.getElementById('taohuoPeople').value = val;
        document.getElementById('yinFuPeople').value = val;
    } else {
        document.getElementById('taohuoPeople').value = val;
        document.getElementById('globalPeople').value = val;
    }
    updateAll();
}

function resetMarketData() {
    marketData = JSON.parse(JSON.stringify(defaultMarketData));
    document.getElementById('taohuoPeople').value = 12;
    document.getElementById('globalPeople').value = 12;
    document.getElementById('yinFuPeople').value = 12;
    buildMarketTable();
    updateAll();
}

function getPeople() {
    return {
        taohuo: parseInt(document.getElementById('taohuoPeople').value) || 12,
        global: parseInt(document.getElementById('globalPeople').value) || 12,
        yinfu: parseInt(document.getElementById('yinFuPeople').value) || 12,
    };
}

function calcDemandExpectation(totalDemand, people, isSpecial) {
    if (people <= 0) return 0;
    let val = Math.round(totalDemand / (people * 4));
    if (isSpecial) val += 1;
    return val;
}

function updateAll() {
    const people = getPeople();
    const year = parseInt(document.getElementById('currentYear').value);
    const quarter = parseInt(document.getElementById('currentQuarter').value);
    const isOrderActive = parseInt(document.getElementById('isOrderActive').value);
    const expectedBudget = parseFloat(document.getElementById('expectedBudget').value) || 8000000;

    document.getElementById('yearDisplay').textContent = year;
    document.getElementById('quarterDisplay').textContent = quarter;
    document.getElementById('expectedBudgetDisplay').textContent = expectedBudget.toLocaleString('zh-CN');

    const alertMsgs = [];
    const alertBadge = document.getElementById('alertBadge');
    if (isOrderActive === 1) {
        alertMsgs.push({ msg: '⚠️ 注意提醒跨境调仓！！！！！', type: 'alert-danger' });
    }
    if (quarter === 4) {
        alertMsgs.push({ msg: '⚠️ 注意提醒入驻京西', type: 'alert-warning' });
    }
    document.getElementById('alertMessages').innerHTML = alertMsgs.map(a =>
        `<div class="alert ${a.type}">${a.msg}</div>`
    ).join('');
    alertBadge.style.display = alertMsgs.length > 0 ? 'inline-flex' : 'none';
    if (alertMsgs.length > 0) {
        alertBadge.textContent = alertMsgs.map(a => a.msg.replace('⚠️ ', '')).join(' | ');
    }

    const orderBadge = document.getElementById('orderBadge');
    orderBadge.textContent = isOrderActive === 1 ? '📦 订单获取中' : '📦 订单未获取';
    orderBadge.style.background = isOrderActive === 1 ? 'rgba(211,47,47,0.25)' : 'rgba(255,255,255,0.15)';

    const demandExps = products.map((p, i) => ({
        taohuo: calcDemandExpectation(marketData[i].taohuo, people.taohuo, p.isSpecial),
        global: calcDemandExpectation(marketData[i].global, people.global, p.isSpecial),
        yinfu: calcDemandExpectation(marketData[i].yinfu, people.yinfu, p.isSpecial),
        rate: marketData[i].rate,
        unitPrice: p.unitPrice,
        name: p.name,
        isSpecial: p.isSpecial,
    }));

    demandExps.forEach((d, i) => {
        document.getElementById(`taohuoExp_${i}`).textContent = d.taohuo;
        document.getElementById(`globalExp_${i}`).textContent = d.global;
        document.getElementById(`yinfuExp_${i}`).textContent = d.yinfu;
    });

    const totalDemands = demandExps.map(d => ({
        m1: (d.taohuo + d.global) * 2,
        m2: d.taohuo + 2 * d.global + d.yinfu,
        m3: d.taohuo + d.yinfu,
    }));

    const selectQtys = totalDemands.map((td, i) => ({
        m1: Math.round(td.m1 * demandExps[i].rate),
        m2: Math.round(td.m2 * demandExps[i].rate),
        m3: Math.round(td.m3 * demandExps[i].rate),
    }));

    const budgets = selectQtys.map((sq, i) => ({
        m1: sq.m1 * demandExps[i].unitPrice,
        m2: sq.m2 * demandExps[i].unitPrice,
        m3: sq.m3 * demandExps[i].unitPrice,
    }));

    const totalBudget1 = budgets.reduce((s, b) => s + b.m1, 0);
    const totalBudget2 = budgets.reduce((s, b) => s + b.m2, 0);
    const totalBudget3 = budgets.reduce((s, b) => s + b.m3, 0);

    const recommendMethod = getRecommendMethod();

    const summaryDiv = document.getElementById('budgetSummary');
    summaryDiv.innerHTML = `
        <div class="budget-card ${recommendMethod === 1 ? 'featured' : ''}">
            <h3>方式1: 2淘货2全球</h3>
            <div class="amount">¥${totalBudget1.toLocaleString('zh-CN', {minimumFractionDigits:2,maximumFractionDigits:2})}</div>
            <div class="subtitle">总需求 = (淘货期望 + 全球期望) × 2</div>
        </div>
        <div class="budget-card ${recommendMethod === 2 ? 'featured' : ''}">
            <h3>方式2: 1淘货2全球+音符</h3>
            <div class="amount">¥${totalBudget2.toLocaleString('zh-CN', {minimumFractionDigits:2,maximumFractionDigits:2})}</div>
            <div class="subtitle">总需求 = 淘货期望 + 2×全球期望 + 音符期望</div>
        </div>
        <div class="budget-card ${recommendMethod === 3 ? 'featured' : ''}">
            <h3>方式3: 1淘货+1音符</h3>
            <div class="amount">¥${totalBudget3.toLocaleString('zh-CN', {minimumFractionDigits:2,maximumFractionDigits:2})}</div>
            <div class="subtitle">总需求 = 淘货期望 + 音符期望</div>
        </div>
    `;

    const detailBody = document.getElementById('budgetDetailBody');
    detailBody.innerHTML = demandExps.map((d, i) => `
        <tr>
            <td style="font-weight:700;">${d.name}</td>
            <td>${totalDemands[i].m1}</td>
            <td>${selectQtys[i].m1}</td>
            <td class="result-cell">¥${budgets[i].m1.toLocaleString('zh-CN',{minimumFractionDigits:2,maximumFractionDigits:2})}</td>
            <td>${totalDemands[i].m2}</td>
            <td>${selectQtys[i].m2}</td>
            <td class="result-cell">¥${budgets[i].m2.toLocaleString('zh-CN',{minimumFractionDigits:2,maximumFractionDigits:2})}</td>
            <td>${totalDemands[i].m3}</td>
            <td>${selectQtys[i].m3}</td>
            <td class="result-cell">¥${budgets[i].m3.toLocaleString('zh-CN',{minimumFractionDigits:2,maximumFractionDigits:2})}</td>
        </tr>
    `).join('') + `
        <tr style="font-weight:800;background:#fffde7;">
            <td>📌 总预算</td>
            <td colspan="2" class="result-highlight">¥${totalBudget1.toLocaleString('zh-CN',{minimumFractionDigits:2,maximumFractionDigits:2})}</td>
            <td></td>
            <td colspan="2" class="result-highlight">¥${totalBudget2.toLocaleString('zh-CN',{minimumFractionDigits:2,maximumFractionDigits:2})}</td>
            <td></td>
            <td colspan="2" class="result-highlight">¥${totalBudget3.toLocaleString('zh-CN',{minimumFractionDigits:2,maximumFractionDigits:2})}</td>
        </tr>
    `;

    const diffDiv = document.getElementById('budgetDiffAnalysis');
    let diffRows = '';
    for (let q = 1; q <= 4; q++) {
        const method = recommendMap[`${year},${q}`] || 3;
        let budgetVal;
        if (method === 1) budgetVal = totalBudget1;
        else if (method === 2) budgetVal = totalBudget2;
        else budgetVal = totalBudget3;
        const diff = Math.abs(budgetVal - expectedBudget);
        const status = diff < expectedBudget * 0.05 ? '✅ 接近' : diff < expectedBudget * 0.15 ? '⚠️ 有偏差' : '🔴 偏差较大';
        diffRows += `
        <tr>
            <td>第${q}季度</td>
            <td>方案${method}</td>
            <td class="result-cell">¥${budgetVal.toLocaleString('zh-CN',{minimumFractionDigits:2,maximumFractionDigits:2})}</td>
            <td>¥${diff.toLocaleString('zh-CN',{minimumFractionDigits:2,maximumFractionDigits:2})}</td>
            <td>${status}</td>
        </tr>`;
    }
    diffDiv.innerHTML = `
        <table style="width:100%;font-size:0.85rem;">
            <tr><th>季度</th><th>推荐方案</th><th>预算金额</th><th>与预期差值</th><th>状态</th></tr>
            ${diffRows}
        </table>
    `;

    window._cachedSelectQtys = selectQtys;
    window._cachedDemandExps = demandExps;
    updateCrossBorder();
    updateSpecialCalc();
}

function updateCrossBorder() {
    const selectQtys = window._cachedSelectQtys;
    const demandExps = window._cachedDemandExps;
    if (!selectQtys || !demandExps) return;
    const mode = parseInt(document.getElementById('crossBorderBudgetMode').value);
    const exchangeRate = parseFloat(document.getElementById('exchangeRate').value) || 7.18;
    const tariffRate = parseFloat(document.getElementById('tariffRate').value) || 0.0563;

    const quantities = products.map((p, i) => {
        if (i < 3) {
            const inputEl = document.getElementById(`cb_qty_${i}`);
            if (inputEl && inputEl.value !== '') return parseFloat(inputEl.value) || 0;
        }
        return mode === 0 ? selectQtys[i].m1 : mode === 1 ? selectQtys[i].m2 : selectQtys[i].m3;
    });

    const volumes = products.map((p, i) => p.volCoef * quantities[i]);
    const volFreights = volumes.map(v => v * 0.004);
    const weightFreights = products.map((p, i) => p.weightCoef * quantities[i] * 4);
    const actualFreights = products.map((p, i) => Math.max(volFreights[i], weightFreights[i]));
    const rawMaterialCosts = products.map((p, i) => quantities[i] * p.unitPrice);
    const insuranceCosts = products.map((p, i) => (rawMaterialCosts[i] + actualFreights[i]) * 1.1 * 0.012);
    const totalVolume = volumes.reduce((s, v) => s + v, 0);
    const packingFee = Math.ceil(totalVolume / 54000000) * 100;
    const sumF = actualFreights.reduce((s, v) => s + v, 0);
    const sumG = rawMaterialCosts.reduce((s, v) => s + v, 0);
    const sumH = insuranceCosts.reduce((s, v) => s + v, 0);
    const totalCostCNY = Math.floor((sumH + packingFee + sumF + sumG + 450) * 100) / 100;
    const totalCostUSD = totalCostCNY / exchangeRate * (1 + tariffRate);

    document.getElementById('totalCostCNY').textContent = '¥' + totalCostCNY.toLocaleString('zh-CN', {minimumFractionDigits:2,maximumFractionDigits:2});
    document.getElementById('totalCostUSD').textContent = '$' + totalCostUSD.toLocaleString('zh-CN', {minimumFractionDigits:2,maximumFractionDigits:2});

    const cbBody = document.getElementById('crossBorderBody');
    cbBody.innerHTML = products.map((p, i) => `
        <tr>
            <td style="font-weight:700;">${p.name}</td>
            <td>${i < 3 ? `<input type="number" id="cb_qty_${i}" value="${quantities[i]}" step="1" min="0" style="width:80px;">` : quantities[i]}</td>
            <td>${volumes[i].toLocaleString('zh-CN',{maximumFractionDigits:0})}</td>
            <td>${volFreights[i].toFixed(2)}</td>
            <td>${weightFreights[i].toFixed(2)}</td>
            <td style="font-weight:600;">${actualFreights[i].toFixed(2)}</td>
            <td>${rawMaterialCosts[i].toLocaleString('zh-CN',{maximumFractionDigits:0})}</td>
            <td>${insuranceCosts[i].toFixed(2)}</td>
            <td>${i===0 ? packingFee.toFixed(2) : '-'}</td>
        </tr>
    `).join('') + `
        <tr style="font-weight:800;background:#fffde7;">
            <td colspan="3">📦 合计</td>
            <td>${volFreights.reduce((s,v)=>s+v,0).toFixed(2)}</td>
            <td>${weightFreights.reduce((s,v)=>s+v,0).toFixed(2)}</td>
            <td>${sumF.toFixed(2)}</td>
            <td>${sumG.toLocaleString('zh-CN',{maximumFractionDigits:0})}</td>
            <td>${sumH.toFixed(2)}</td>
            <td>${packingFee.toFixed(2)}</td>
        </tr>
    `;

    // 为跨境调动表格中可编辑的个数输入框绑定事件
    for (let i = 0; i < 3; i++) {
        const input = document.getElementById(`cb_qty_${i}`);
        if (input) {
            input.addEventListener('change', updateCrossBorder);
        }
    }
}

function updateSpecialCalc() {
    calcSpecial('dogExisting', 'dogDemand', 'dogExpected', 1.35, 1.5, 440, 1100, 135000, 'dogResult');
    calcSpecial('carExisting', 'carDemand', 'carExpected', 1.52, 0.5/0.3, 500, 1250, 152000, 'carResult');
    calcSpecial('seatExisting', 'seatDemand', 'seatExpected', 1.68, 0.7/0.5, 750, 1875, 168000, 'seatResult');
}

function calcSpecial(existingId, demandId, expectedId, coefA, coefB, unitCost, sellPrice, machineCost, resultId) {
    const existing = parseInt(document.getElementById(existingId).value) || 0;
    const demand = parseInt(document.getElementById(demandId).value) || 0;
    const expected = parseInt(document.getElementById(expectedId).value) || 0;
    const mid1 = Math.pow(coefA * expected, 0.7);
    const mid2 = demand / (coefB * 63 * 0.9 * mid1);
    const recommendedWorkers = Math.round(Math.pow(mid2, 10 / 3));
    const totalCost = Math.ceil(unitCost * demand / 0.9 + recommendedWorkers * 15000 + (expected - existing) * machineCost);
    const profit = sellPrice * demand * 0.9 - totalCost;
    document.getElementById(resultId).innerHTML = `
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:6px;font-size:0.85rem;">
            <span>中间值1:</span><strong>${mid1.toFixed(4)}</strong>
            <span>中间值2:</span><strong>${mid2.toFixed(4)}</strong>
            <span>推荐人工数:</span><strong class="highlight-worker">${recommendedWorkers} 人</strong>
            <span>方案花费:</span><strong style="color:#d93025;">¥${totalCost.toLocaleString('zh-CN')}</strong>
            <span>方案盈利:</span><strong style="color:#0d904f;">¥${profit.toLocaleString('zh-CN',{minimumFractionDigits:2,maximumFractionDigits:2})}</strong>
        </div>
    `;
}

// 页面加载完成后初始化
document.addEventListener('DOMContentLoaded', init);