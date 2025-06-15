// 牛奶管家 - 云端同步完整版
const MilkManager = (() => {
    // 配置项
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
        stock: ['🥛', '🥛', '🥛'], // 默认初始3包
        history: []
    };

    const dom = {};

    /* ========== 初始化方法 ========== */
    const setupDOM = () => {
        dom.container = document.querySelector(config.containerId);
        Object.entries(config.elements).forEach(([key, selector]) => {
            dom[key] = document.querySelector(selector);
        });
    };

    const bindEvents = () => {
        // 补货按钮
        document.querySelectorAll('.add-btn').forEach(btn => {
            btn.addEventListener('click', () => handleAdd(parseInt(btn.dataset.amount)));
        });

        // 消耗按钮
        document.querySelectorAll('.remove-btn').forEach(btn => {
            btn.addEventListener('click', () => handleDrink(parseInt(btn.dataset.amount)));
        });

        // 撤销按钮
        if (dom.undoBtn) dom.undoBtn.addEventListener('click', undoAction);
        
        // 退出按钮
        if (dom.logoutBtn) {
            dom.logoutBtn.addEventListener('click', () => {
                localStorage.removeItem('github_token');
                alert('已退出登录，请刷新页面重新输入Token');
            });
        }
    };

    /* ========== 核心功能 ========== */
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

    /* ========== 数据同步 ========== */
    const loadDataWithRetry = async (retryCount = 0) => {
        try {
            // 优先从GitHub加载
            const cloudData = await fetchGist();
            if (cloudData) {
                state = cloudData;
                showStatus('✅ 云端数据已加载', 'success');
            } else {
                // 降级到本地存储
                const localData = localStorage.getItem(config.storageKey);
                if (localData) state = JSON.parse(localData);
                showStatus('⚠️ 使用本地数据', 'warning');
            }
            render();
        } catch (e) {
            console.error('数据加载失败:', e);
            if (retryCount < 2) {
                setTimeout(() => loadDataWithRetry(retryCount + 1), 2000);
            } else {
                showStatus('❌ 数据加载失败', 'error');
            }
        }
    };

    const saveData = async () => {
        // 本地保存
        localStorage.setItem(config.storageKey, JSON.stringify(state));
        
        // 云端同步
        try {
            await updateGist();
            showStatus('✅ 已同步到云端', 'success');
        } catch (e) {
            console.error('云端同步失败:', e);
            showStatus('❌ 同步失败 (已本地保存)', 'error');
        }
    };

    /* ========== GitHub API交互 ========== */
    const fetchGist = async () => {
        if (!config.gist.gistId || !config.gist.token) return null;
        
        const response = await fetch(`https://api.github.com/gists/${config.gist.gistId}`, {
            headers: {
                'Authorization': `token ${config.gist.token}`,
                'Accept': 'application/vnd.github.v3+json'
            }
        });
        
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
                description: `牛奶管家同步数据 (${new Date().toLocaleString()})`,
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
        
        // 保存新创建的Gist ID
        if (!config.gist.gistId && data.id) {
            config.gist.gistId = data.id;
            localStorage.setItem('gistId', data.id);
        }
    };

    /* ========== 界面渲染 ========== */
    const render = () => {
        // 更新计数器
        dom.counter.innerHTML = `🥛 当前余量：${state.stock.length}包 ${
            state.stock.length <= 3 ? '<span class="warning">（该补货了！）</span>' : ''
        }`;

        // 更新牛奶显示
        dom.display.innerHTML = state.stock.map(() => '<div class="milk-item">🥛</div>').join('');

        // 更新历史记录
        const recentHistory = state.history.slice(-5).reverse();
        dom.history.innerHTML = recentHistory.map(record => `
            <div class="record-item ${record.type}">
                ${record.type === 'add' ? '🛒' : '🥤'}
                <span class="timestamp">${record.time}</span>
                ${record.type === 'add' ? '补货' : '喝掉'} ${record.amount}包
            </div>
        `).join('') || '<div class="empty">~ 暂无记录 ~</div>';
    };

    const showStatus = (text, type) => {
        if (dom.statusText) {
            dom.statusText.textContent = text;
            dom.statusText.className = `sync-status ${type}`;
            setTimeout(() => dom.statusText.textContent = '', 3000);
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

    // 暴露初始化方法
    return { init };
})();

// 页面加载后启动
document.addEventListener('DOMContentLoaded', MilkManager.init);
