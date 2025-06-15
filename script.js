const MilkManager = (() => {
    // 配置项
    const config = {
        gist: {
            token: localStorage.getItem('github_token'),
            filename: 'milk-data.json',
            gistId: localStorage.getItem('gistId'),
            apiUrl: 'https://api.github.com/gists',
            // 新增缓存清除参数
            cacheBuster: true
        },
        storageKey: 'milkData_sync_v2',
        syncInterval: 3000 // 3秒检查一次更新
    };

    let state = {
        stock: [],
        history: [],
        _version: Date.now() // 数据版本标识
    };

    // DOM元素
    const dom = {
        display: document.getElementById('milkDisplay'),
        counter: document.getElementById('milkCounter'),
        history: document.getElementById('historyLog'),
        status: document.getElementById('syncStatus')
    };

    /* ========== 同步核心 ========== */
    const forceSync = async () => {
        const syncStart = Date.now();
        try {
            // 1. 准备同步数据
            state._version = syncStart;
            const syncData = {
                ...state,
                _sync: syncStart,
                _device: 'web_' + navigator.userAgent.slice(0, 30)
            };

            // 2. 更新GitHub Gist
            const url = config.gist.gistId ? 
                `${config.gist.apiUrl}/${config.gist.gistId}` : 
                config.gist.apiUrl;
            
            const response = await fetch(url + (config.gist.cacheBuster ? `?t=${syncStart}` : ''), {
                method: config.gist.gistId ? 'PATCH' : 'POST',
                headers: {
                    'Authorization': `token ${config.gist.token}`,
                    'Content-Type': 'application/json',
                    'Accept': 'application/vnd.github.v3+json'
                },
                body: JSON.stringify({
                    description: `牛奶同步 @ ${new Date().toLocaleString()}`,
                    public: false,
                    files: {
                        [config.gist.filename]: {
                            content: JSON.stringify(syncData)
                        }
                    }
                })
            });

            const data = await response.json();
            if (!response.ok) throw new Error(data.message || '同步失败');

            // 3. 处理新创建的Gist
            if (!config.gist.gistId && data.id) {
                config.gist.gistId = data.id;
                localStorage.setItem('gistId', data.id);
            }

            showStatus(`✅ 同步成功 (${Date.now() - syncStart}ms)`);
            return true;
        } catch (error) {
            console.error('强制同步失败:', error);
            showStatus(`❌ 同步失败: ${error.message}`);
            return false;
        }
    };

    /* ========== 数据加载 ========== */
    const loadWithRetry = async (attempt = 0) => {
        try {
            // 1. 尝试从GitHub加载
            if (config.gist.token && config.gist.gistId) {
                const response = await fetch(
                    `${config.gist.apiUrl}/${config.gist.gistId}?t=${Date.now()}`,
                    {
                        headers: {
                            'Authorization': `token ${config.gist.token}`,
                            'Accept': 'application/vnd.github.v3+json'
                        },
                        cache: 'no-store'
                    }
                );

                if (response.ok) {
                    const data = await response.json();
                    const remoteData = JSON.parse(data.files[config.gist.filename].content);
                    
                    // 版本比较
                    if (remoteData._version > (state._version || 0)) {
                        state = remoteData;
                        showStatus(`🔄 已加载v${remoteData._version}`);
                        render();
                        return true;
                    }
                    return false; // 无新版本
                }
            }

            // 2. 降级到本地加载
            const localData = localStorage.getItem(config.storageKey);
            if (localData) {
                state = JSON.parse(localData);
                showStatus('⚠️ 使用本地数据');
                render();
            }
        } catch (error) {
            console.error(`数据加载尝试${attempt + 1}失败:`, error);
            if (attempt < 2) {
                await new Promise(resolve => setTimeout(resolve, 1500));
                return loadWithRetry(attempt + 1);
            }
            showStatus('❌ 加载失败');
        }
        return false;
    };

    /* ========== 定时同步 ========== */
    let syncTimer;
    const startSyncTimer = () => {
        syncTimer = setInterval(async () => {
            await loadWithRetry(); // 只检查更新不上传
        }, config.syncInterval);
    };

    /* ========== 操作处理 ========== */
    const handleAction = async (type, amount) => {
        // 更新数据
        if (type === 'add') {
            state.stock.push(...Array(amount).fill('🥛'));
        } else {
            if (amount > state.stock.length) {
                alert('库存不足！');
                return;
            }
            state.stock.splice(0, amount);
        }
        
        // 记录历史
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

        // 立即同步
        render();
        await forceSync();
    };

    // ...（render等其他方法保持不变）...

    /* ========== 初始化 ========== */
    const init = async () => {
        await loadWithRetry();
        bindEvents();
        startSyncTimer();
        showStatus('系统就绪');
    };

    return { init };
})();

// 启动应用
document.addEventListener('DOMContentLoaded', () => {
    MilkManager.init().catch(e => {
        console.error('启动失败:', e);
        alert('应用初始化失败，请检查控制台');
    });
});
