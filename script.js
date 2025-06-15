/**
 * 牛奶管家 - 终极稳定版
 * 功能：支持本地存储+GitHub云端同步
 * 特点：严格的定义顺序 + 错误处理 + 调试信息
 */
const MilkManager = (function() {
    // ========== 配置项 ==========
    const CONFIG = {
        containerId: '#milkManager',
        elements: {
            counter: '#milkCounter',
            display: '#milkDisplay',
            history: '#historyLog',
            undoBtn: '#undoBtn',
            logoutBtn: '#logoutBtn',
            statusText: '#syncStatus'
        },
        storageKey: 'milkData_v4',
        gist: {
            filename: 'milk-data.json',
            get token() {
                return localStorage.getItem('github_token');
            },
            get gistId() {
                return localStorage.getItem('gistId');
            },
            set gistId(value) {
                if (value) localStorage.setItem('gistId', value);
                else localStorage.removeItem('gistId');
            }
        }
    };

    // ========== 状态管理 ==========
    const STATE = {
        stock: [],
        history: [],
        init() {
            this.stock = ['🥛', '🥛', '🥛'];
            this.history = [];
        }
    };

    // ========== DOM引用缓存 ==========
    const DOM = (function() {
        const cache = {};
        return {
            get(selector) {
                if (!cache[selector]) {
                    cache[selector] = document.querySelector(selector);
                    if (!cache[selector]) {
                        console.warn(`元素未找到: ${selector}`);
                    }
                }
                return cache[selector];
            }
        };
    })();

    // ========== 工具方法 ==========
    const Utils = {
        showStatus(text, type = 'info') {
            const el = DOM.get(CONFIG.elements.statusText);
            if (el) {
                el.textContent = text;
                el.className = `sync-status ${type}`;
                setTimeout(() => el.textContent = '', 3000);
            }
        },
        
        recordHistory(type, amount) {
            STATE.history.push({
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
        },
        
        async sleep(ms) {
            return new Promise(resolve => setTimeout(resolve, ms));
        }
    };

    // ========== 数据存储 ==========
    const DataService = {
        async load() {
            try {
                // 1. 尝试从GitHub加载
                const cloudData = await this._fetchGist();
                if (cloudData) {
                    Object.assign(STATE, cloudData);
                    Utils.showStatus('✅ 云端数据已加载', 'success');
                    return;
                }
                
                // 2. 降级到本地存储
                const localData = localStorage.getItem(CONFIG.storageKey);
                if (localData) {
                    Object.assign(STATE, JSON.parse(localData));
                    Utils.showStatus('⚠️ 使用本地数据', 'warning');
                } else {
                    STATE.init();
                    Utils.showStatus('🔄 初始化新数据', 'info');
                }
            } catch (e) {
                console.error('数据加载失败:', e);
                STATE.init();
                Utils.showStatus('❌ 加载失败，使用默认数据', 'error');
            }
        },
        
        async save() {
            try {
                // 本地保存
                localStorage.setItem(
                    CONFIG.storageKey, 
                    JSON.stringify({
                        stock: STATE.stock,
                        history: STATE.history.slice(-50) // 限制历史记录数量
                    })
                );
                
                // 云端同步
                await this._updateGist();
                Utils.showStatus('✅ 数据已同步', 'success');
            } catch (e) {
                console.error('数据保存失败:', e);
                Utils.showStatus('❌ 同步失败 (已本地保存)', 'error');
            }
        },
        
        async _fetchGist() {
            if (!CONFIG.gist.token || !CONFIG.gist.gistId) return null;
            
            const response = await fetch(
                `https://api.github.com/gists/${CONFIG.gist.gistId}`, 
                {
                    headers: {
                        'Authorization': `token ${CONFIG.gist.token}`,
                        'Accept': 'application/vnd.github.v3+json'
                    }
                }
            );
            
            if (!response.ok) throw new Error('Gist获取失败');
            const data = await response.json();
            return JSON.parse(data.files[CONFIG.gist.filename].content);
        },
        
        async _updateGist() {
            if (!CONFIG.gist.token) return;
            
            const url = CONFIG.gist.gistId 
                ? `https://api.github.com/gists/${CONFIG.gist.gistId}`
                : 'https://api.github.com/gists';
            
            const response = await fetch(url, {
                method: CONFIG.gist.gistId ? 'PATCH' : 'POST',
                headers: {
                    'Authorization': `token ${CONFIG.gist.token}`,
                    'Content-Type': 'application/json',
                    'Accept': 'application/vnd.github.v3+json'
                },
                body: JSON.stringify({
                    description: `牛奶管家数据同步 (${new Date().toLocaleString()})`,
                    public: false,
                    files: {
                        [CONFIG.gist.filename]: {
                            content: JSON.stringify(STATE)
                        }
                    }
                })
            });
            
            const data = await response.json();
            if (!response.ok) throw new Error(data.message);
            
            // 保存新创建的Gist ID
            if (!CONFIG.gist.gistId && data.id) {
                CONFIG.gist.gistId = data.id;
            }
        }
    };

    // ========== 界面渲染 ==========
    const Renderer = {
        update() {
            this._updateCounter();
            this._updateMilkDisplay();
            this._updateHistory();
            this._updateButtons();
        },
        
        _updateCounter() {
            const el = DOM.get(CONFIG.elements.counter);
            if (el) {
                el.innerHTML = `🥛 当前余量：${STATE.stock.length}包 ${
                    STATE.stock.length <= 3 ? '<span class="warning">（该补货了！）</span>' : ''
                }`;
            }
        },
        
        _updateMilkDisplay() {
            const el = DOM.get(CONFIG.elements.display);
            if (el) {
                el.innerHTML = STATE.stock.map(() => 
                    '<div class="milk-item">🥛</div>'
                ).join('');
            }
        },
        
        _updateHistory() {
            const el = DOM.get(CONFIG.elements.history);
            if (el) {
                const recentHistory = STATE.history.slice(-5).reverse();
                el.innerHTML = recentHistory.map(record => `
                    <div class="record-item ${record.type}">
                        ${record.type === 'add' ? '🛒' : '🥤'}
                        <span class="timestamp">${record.time}</span>
                        ${record.type === 'add' ? '补货' : '喝掉'} ${record.amount}包
                    </div>
                `).join('') || '<div class="empty">~ 暂无记录 ~</div>';
            }
        },
        
        _updateButtons() {
            const undoBtn = DOM.get(CONFIG.elements.undoBtn);
            if (undoBtn) undoBtn.disabled = STATE.history.length === 0;
        }
    };

    // ========== 事件处理器 ==========
    const EventHandlers = {
        async handleAdd(amount) {
            STATE.stock.push(...Array(amount).fill('🥛'));
            Utils.recordHistory('add', amount);
            Renderer.update();
            await DataService.save();
        },
        
        async handleDrink(amount) {
            if (amount > STATE.stock.length) {
                alert('🥛 库存不足！');
                return;
            }
            STATE.stock.splice(0, amount);
            Utils.recordHistory('drink', amount);
            Renderer.update();
            await DataService.save();
        },
        
        async handleUndo() {
            if (STATE.history.length === 0) return;
            
            const last = STATE.history.pop();
            if (last.type === 'add') {
                STATE.stock.splice(-last.amount);
            } else {
                STATE.stock.unshift(...Array(last.amount).fill('🥛'));
            }
            Renderer.update();
            await DataService.save();
        },
        
        handleLogout() {
            localStorage.removeItem('github_token');
            alert('已退出登录，请刷新页面重新输入Token');
        }
    };

    // ========== 初始化系统 ==========
    return {
        async init() {
            console.log('系统启动中...');
            
            // 初始化Token
            if (!CONFIG.gist.token) {
                const token = prompt('🔐 请输入GitHub Token（只需输入一次）:');
                if (token) {
                    localStorage.setItem('github_token', token);
                } else {
                    console.warn("未提供Token，进入离线模式");
                }
            }
            
            // 加载数据
            await DataService.load();
            
            // 绑定事件
            this._bindEvents();
            
            // 初始渲染
            Renderer.update();
            
            console.log('系统就绪！');
        },
        
        _bindEvents() {
            // 补货按钮
            document.querySelectorAll('.add-btn').forEach(btn => {
                btn.addEventListener('click', () => 
                    EventHandlers.handleAdd(parseInt(btn.dataset.amount))
                );
            });
            
            // 消耗按钮
            document.querySelectorAll('.remove-btn').forEach(btn => {
                btn.addEventListener('click', () => 
                    EventHandlers.handleDrink(parseInt(btn.dataset.amount))
                );
            });
            
            // 撤销按钮
            const undoBtn = DOM.get(CONFIG.elements.undoBtn);
            if (undoBtn) {
                undoBtn.addEventListener('click', () => EventHandlers.handleUndo());
            }
            
            // 退出按钮
            const logoutBtn = DOM.get(CONFIG.elements.logoutBtn);
            if (logoutBtn) {
                logoutBtn.addEventListener('click', () => EventHandlers.handleLogout());
            }
        }
    };
})();

// 安全启动
document.addEventListener('DOMContentLoaded', () => {
    try {
        MilkManager.init();
    } catch (error) {
        console.error('启动失败:', error);
        alert('系统初始化失败，请查看控制台日志');
    }
});
