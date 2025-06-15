// 牛奶管家 - 终极修正版
const MilkManager = (() => {
    // 所有函数先定义后使用
    // ========== 工具函数 ==========
    const showStatus = (text, type = 'info') => {
        if (dom.statusText) {
            dom.statusText.textContent = text;
            dom.statusText.className = `sync-status ${type}`;
            setTimeout(() => {
                if (dom.statusText.textContent === text) {
                    dom.statusText.textContent = '';
                }
            }, 3000);
        }
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

    // ========== DOM操作 ==========
    const setupDOM = () => {
        console.log('初始化DOM元素...');
        dom.container = document.querySelector(config.containerId);
        Object.entries(config.elements).forEach(([key, selector]) => {
            dom[key] = document.querySelector(selector);
            if (!dom[key]) console.warn(`未找到元素: ${selector}`);
        });
    };

    const render = () => {
        if (!dom.display || !dom.counter || !dom.history) return;
        
        // 更新牛奶显示
        dom.display.innerHTML = state.stock.map(() => 
            '<div class="milk-item">🥛</div>'
        ).join('');
        
        // 更新计数器
        dom.counter.innerHTML = `🥛 当前余量：${state.stock.length}包 ${
            state.stock.length <= 3 ? '<span class="warning">（该补货了！）</span>' : ''
        }`;
        
        // 更新历史记录
        const recentHistory = state.stock.slice(-5).reverse();
        dom.history.innerHTML = recentHistory.map(record => `
            <div class="record-item ${record.type}">
                ${record.type === 'add' ? '🛒' : '🥤'}
                <span class="timestamp">${record.time}</span>
                ${record.type === 'add' ? '补货' : '喝掉'} ${record.amount}包
            </div>
        `).join('') || '<div class="empty">~ 暂无记录 ~</div>';
    };

    // ========== 数据操作 ==========
    const loadDataWithRetry = async (retryCount = 0) => {
        try {
            const cloudData = await fetchGist();
            const localData = localStorage.getItem(config.storageKey);
            
            state = cloudData || (localData ? JSON.parse(localData) : { 
                stock: ['🥛', '🥛', '🥛'], 
                history: [] 
            });
            
            render();
        } catch (e) {
            console.error(`数据加载失败(尝试 ${retryCount + 1}/3):`, e);
            if (retryCount < 2) {
                setTimeout(() => loadDataWithRetry(retryCount + 1), 2000);
            } else {
                state = { stock: ['🥛', '🥛', '🥛'], history: [] };
                render();
                showStatus('⚠️ 使用默认数据', 'warning');
            }
        }
    };

    const saveData = async () => {
        localStorage.setItem(config.storageKey, JSON.stringify(state));
        try {
            await updateGist();
            showStatus('✅ 已同步', 'success');
        } catch (e) {
            console.error('同步失败:', e);
            showStatus('❌ 同步失败 (已本地保存)', 'error');
        }
    };

    // ========== GitHub交互 ==========
    const fetchGist = async () => {
        if (!config.gist.token || !config.gist.gistId) return null;
        
        const response = await fetch(
            `https://api.github.com/gists/${config.gist.gistId}`, 
            {
                headers: {
                    'Authorization': `token ${config.gist.token}`,
                    'Accept': 'application/vnd.github.v3+json'
                }
            }
        );
        
        if (!response.ok) throw new Error('Gist获取失败');
        const data = await response.json();
        return JSON.parse(data.files[config.gist.filename].content);
    };

    const updateGist = async () => {
        if (!config.gist.token) return;
        
        const url = config.gist.gistId ? 
            `https://api.github.com/gists/${config.gist.gistId}` : 
            'https://api.github.com/gists';
        
        const response = await fetch(url, {
            method: config.gist.gistId ? 'PATCH' : 'POST',
            headers: {
                'Authorization': `token ${config.gist.token}`,
                'Content-Type': 'application/json',
                'Accept': 'application/vnd.github.v3+json'
            },
            body: JSON.stringify({
                description: `牛奶管家数据同步 (${new Date().toLocaleString()})`,
                public: false,
                files: {
                    [config.gist.filename]: {
                        content: JSON.stringify(state)
                    }
                }
            })
        });
        
        const data = await response.json();
        if (!response.ok) throw new Error(data.message);
        
        if (!config.gist.gistId && data.id) {
            config.gist.gistId = data.id;
            localStorage.setItem('gistId', data.id);
        }
    };

    // ========== 事件处理 ==========
    const handleAdd = async (amount) => {
        state.stock.push(...Array(amount).fill('🥛'));
        recordHistory('add', amount);
        render();
        await saveData();
    };

    const handleDrink = async (amount) => {
        if (amount > state.stock.length) {
            alert('🥛 库存不足！');
            return;
        }
        state.stock.splice(0, amount);
        recordHistory('drink', amount);
        render();
        await saveData();
    };

    const undoAction = async () => {
        if (state.history.length === 0) return;
        
        const last = state.history.pop();
        if (last.type === 'add') {
            state.stock.splice(-last.amount);
        } else {
            state.stock.unshift(...Array(last.amount).fill('🥛'));
        }
        render();
        await saveData();
    };

    const bindEvents = () => {
        console.log('绑定事件监听器...');
        // 补货按钮
        document.querySelectorAll('.add-btn').forEach(btn => {
            btn.addEventListener('click', () => handleAdd(parseInt(btn.dataset.amount)));
        });
        
        // 消耗按钮
        document.querySelectorAll('.remove-btn').forEach(btn => {
            btn.addEventListener('click', () => handleDrink(parseInt(btn.dataset.amount)));
        });
        
        // 撤销按钮
        if (dom.undoBtn) {
            dom.undoBtn.addEventListener('click', undoAction);
        }
        
        // 退出按钮
        if (dom.logoutBtn) {
            dom.logoutBtn.addEventListener('click', () => {
                localStorage.removeItem('github_token');
                alert('已退出登录，请刷新页面');
            });
        }
    };

    // ========== 初始化配置 ==========
    const config = {
        containerId: '#milkManager',
        elements: {
            counter: '#milkCounter',
            display: '#milkDisplay',
            history: '#historyLog',
            undoBtn: '#undoBtn',
            logoutBtn: '#logoutBtn',
            statusText: '#syncStatus'
        },
        storageKey: 'milkData_v3',
        gist: {
            token: localStorage.getItem('github_token'),
            filename: 'milk-data.json',
            gistId: localStorage.getItem('gistId') || null,
            pendingSync: false
        }
    };

    let state = {
        stock: [],
        history: []
    };

    const dom = {};

    // 主初始化函数
    const init = () => {
        console.log('系统初始化...');
        setupDOM();
        loadDataWithRetry();
        bindEvents();
    };

    return { init };
})();

// 安全启动
document.addEventListener('DOMContentLoaded', () => {
    try {
        MilkManager.init();
    } catch (e) {
        console.error('启动失败:', e);
        alert('系统初始化失败，请检查控制台日志');
    }
});
