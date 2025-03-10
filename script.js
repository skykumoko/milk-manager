// 增强版牛奶管理系统
const MilkManager = (() => {
    const config = {
        containerId: '#milkManager',
        elements: {
            counter: '#milkCounter',
            display: '#milkDisplay',
            history: '#historyLog',
            undoBtn: '#undoBtn'
        },
        storageKey: 'milkData_v2'
    };

    let state = {
        stock: [],
        history: []
    };

    // DOM元素缓存
    const dom = {};

    const init = () => {
        console.log('🚀 系统初始化...');
        
        try {
            // 缓存DOM元素
            dom.container = document.querySelector(config.containerId);
            dom.counter = document.querySelector(config.elements.counter);
            dom.display = document.querySelector(config.elements.display);
            dom.history = document.querySelector(config.elements.history);
            dom.undoBtn = document.querySelector(config.elements.undoBtn);

            // 加载初始数据
            loadData();
            
            // 绑定事件
            bindEvents();
            
            // 首次渲染
            render();
        } catch (error) {
            showFatalError('系统初始化失败，请刷新页面');
            console.error('初始化错误:', error);
        }
    };

    const loadData = () => {
        try {
            const saved = localStorage.getItem(config.storageKey);
            if (saved) {
                const data = JSON.parse(saved);
                state.stock = data.stock?.length ? data.stock : Array(3).fill('🥛');
                state.history = data.history || [];
            } else {
                resetToDefault();
            }
        } catch (e) {
            console.warn('数据加载失败，使用默认值');
            resetToDefault();
        }
    };

    const resetToDefault = () => {
        state = {
            stock: Array(3).fill('🥛'),
            history: []
        };
    };

    const bindEvents = () => {
        // 使用事件委托统一处理按钮点击
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
        state.stock.push(...new Array(amount).fill('🥛'));
        recordHistory('add', amount);
        update();
    };

    const handleDrink = (amount) => {
        if (amount > state.stock.length) {
            alert('当前库存不足！');
            return;
        }
        state.stock.splice(0, amount);
        recordHistory('drink', amount);
        update();
    };

    const undoAction = () => {
        if (state.history.length === 0) return;

        const last = state.history.pop();
        if (last.type === 'add') {
            state.stock.splice(-last.amount);
        } else {
            state.stock.unshift(...new Array(last.amount).fill('🥛'));
        }
        update();
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

    const render = () => {
        try {
            // 更新计数器
            dom.counter.innerHTML = `🥛 当前余量：${state.stock.length}包 ${
                state.stock.length <= 3 ? '<span class="warning">（该补货了！）</span>' : ''
            }`;

            // 渲染牛奶图标
            dom.display.innerHTML = state.stock.map(() => `
                <div class="milk-item">🥛</div>
            `).join('');

            // 渲染历史记录
            dom.history.innerHTML = `
                <div class="history-title">📋 操作记录（最近5条）</div>
                ${state.history.slice(-5).map(record => `
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

            // 持久化数据
            saveData();
        } catch (error) {
            console.error('渲染错误:', error);
        }
    };

    const saveData = () => {
        try {
            localStorage.setItem(config.storageKey, JSON.stringify({
                stock: state.stock,
                history: state.history.slice(-50)
            }));
        } catch (e) {
            console.warn('数据保存失败:', e);
        }
    };

    const showFatalError = (message) => {
        dom.container.innerHTML = `
            <div class="error-box">
                ❗ ${message}
                <button onclick="location.reload()">点击重试</button>
            </div>
        `;
    };

    return { init };
})();

// 安全启动
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', MilkManager.init);
} else {
    MilkManager.init();
}
