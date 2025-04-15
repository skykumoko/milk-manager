// file: script.js
const MilkManager = (() => {
    const config = {
        containerId: '#milkManager',
        elements: {
            counter: '#milkCounter',
            display: '#milkDisplay',
            history: '#historyLog',
            undoBtn: '#undoBtn'
        },
        storageKey: 'milkData_v3'
    };

    let state = {
        stock: [],
        history: []
    };

    const dom = {};

    const init = () => {
        console.log('🚀 系统启动...');
        
        try {
            // 缓存DOM元素
            dom.container = document.querySelector(config.containerId);
            dom.counter = document.querySelector(config.elements.counter);
            dom.display = document.querySelector(config.elements.display);
            dom.history = document.querySelector(config.elements.history);
            dom.undoBtn = document.querySelector(config.elements.undoBtn);

            loadData();
            bindEvents();
            render();
        } catch (error) {
            showError('系统初始化失败，请刷新页面');
            console.error('初始化错误:', error);
        }
    };

    const loadData = () => {
        try {
            const saved = localStorage.getItem(config.storageKey);
            if (saved) {
                const data = JSON.parse(saved);
                state.stock = data.stock || resetStock();
                state.history = data.history || [];
            } else {
                resetSystem();
            }
        } catch (e) {
            console.warn('加载数据失败，重置系统');
            resetSystem();
        }
    };

    const resetStock = () => Array(3).fill('🥛');
    
    const resetSystem = () => {
        state = {
            stock: resetStock(),
            history: []
        };
    };

    const bindEvents = () => {
        dom.container.addEventListener('click', (e) => {
            const btn = e.target.closest('button');
            if (!btn) return;

            if (btn.classList.contains('add-btn')) {
                handleAdd(parseInt(btn.dataset.amount));
            } else if (btn.classList.contains('remove-btn')) {
                handleDrink(parseInt(btn.dataset.amount));
            } else if (btn.id === 'undoBtn') {
                undoAction();
            }
        });
    };

    const handleAdd = (amount) => {
        state.stock.push(...Array(amount).fill('🥛'));
        recordHistory('add', amount);
        saveAndRender();
    };

    const handleDrink = (amount) => {
        if (amount > state.stock.length) {
            alert('🥛 库存不足！');
            return;
        }
        state.stock.splice(0, amount);
        recordHistory('drink', amount);
        saveAndRender();
    };

    const undoAction = () => {
        if (state.history.length === 0) return;

        const last = state.history.pop();
        if (last.type === 'add') {
            state.stock.splice(-last.amount);
        } else {
            state.stock.unshift(...Array(last.amount).fill('🥛'));
        }
        saveAndRender();
    };

    const recordHistory = (type, amount) => {
        state.history.push({
            type,
            amount,
            time: new Date().toLocaleString('zh-CN', { 
                hour12: false,
                year: 'numeric',
                month: '2-digit',
                day: '2-digit',
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit'
            })
        });
    };

    const saveAndRender = () => {
        saveData();
        render();
    };

    const render = () => {
        // 更新计数器
        dom.counter.innerHTML = `🥛 当前余量：${state.stock.length}包 ${
            state.stock.length <= 3 ? '<span class="warning">（该补货了！）</span>' : ''
        }`;

        // 更新牛奶图标
        dom.display.innerHTML = state.stock.map(() => 
            '<div class="milk-item">🥛</div>'
        ).join('');

        // 更新历史记录（修改了这部分）
        const recentHistory = state.history.slice(-5).reverse(); // 添加.reverse()反转数组
        dom.history.innerHTML = `
            <div class="history-title">📋 操作记录（最近5条）</div>
            ${recentHistory.map(record => `
                <div class="record-item ${record.type}">
                    ${record.type === 'add' ? '🛒' : '🥤'}
                    <span class="timestamp">${record.time}</span>
                    <span class="${record.type}-text">
                        ${record.type === 'add' ? '补货' : '喝掉'} ${record.amount} 包
                    </span>
                </div>
            `).join('') || '<div class="empty">~ 暂无记录 ~</div>'}
        `;

        // 更新撤销按钮状态
        dom.undoBtn.disabled = state.history.length === 0;
    };

    const saveData = () => {
        try {
            localStorage.setItem(config.storageKey, JSON.stringify({
                stock: state.stock,
                history: state.history.slice(-50)
            }));
        } catch (e) {
            console.error('保存失败:', e);
        }
    };

    const showError = (msg) => {
        dom.container.innerHTML = `
            <div class="error-box">
                ❗ ${msg}
                <button onclick="location.reload()">点击重试</button>
            </div>
        `;
    };

    return { init };
})();

// 启动系统
document.addEventListener('DOMContentLoaded', MilkManager.init);
