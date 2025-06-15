// 牛奶管家 - 自动同步版
const MilkManager = (() => {
    // 配置项
    const config = {
        containerId: '#milkManager',
        elements: {
            counter: '#milkCounter',
            display: '#milkDisplay',
            history: '#historyLog',
            undoBtn: '#undoBtn',
            statusText: '#syncStatus'
        },
        storageKey: 'milkData_v3',
        gist: {
            token: null, // 动态获取
            filename: 'milk-data.json',
            gistId: localStorage.getItem('gistId') || null,
            pendingSync: false
        }
    };

    // 状态管理
    let state = {
        stock: [],
        history: []
    };

    // DOM缓存
    const dom = {};

    /* ========== Token 管理 ========== */
    const initToken = () => {
        // 1. 尝试从本地获取已保存的Token
        const savedToken = localStorage.getItem('github_token');
        if (savedToken) return savedToken;

        // 2. 首次使用时提示输入
        const newToken = prompt('🔐 请输入GitHub Token（只需输入一次）:');
        if (newToken) {
            localStorage.setItem('github_token', newToken);
            return newToken;
        }

        // 3. 用户取消输入则进入离线模式
        console.warn("未提供Token，进入离线模式");
        return null;
    };

    /* ========== 核心功能 ========== */
    const init = () => {
        console.log('系统启动中...');
        
        // 初始化Token
        config.gist.token = initToken();
        
        setupDOM();
        loadDataWithRetry();
        bindEvents();
        render();
    };

    // 数据加载（自动重试3次）
    const loadDataWithRetry = async (retryCount = 0) => {
        // ...保持原有加载逻辑不变...
    };

    // 静默同步
    const silentSync = async () => {
        // ...保持原有静默同步逻辑不变...
    };

    // 保存数据（自动同步）
    const saveData = async () => {
        // ...保持原有保存逻辑不变...
    };

    /* ========== GitHub 交互 ========== */
    const fetchGist = async () => {
        // ...保持原有获取逻辑不变...
    };

    const updateGist = async () => {
        // ...保持原有更新逻辑不变...
    };

    /* ========== 界面交互 ========== */
    const bindEvents = () => {
        // ...保持原有事件绑定逻辑不变...
    };

    const showStatus = (text, type = 'info') => {
        // ...保持原有状态显示逻辑不变...
    };

    /* ========== 工具方法 ========== */
    const resetStock = () => Array(3).fill('🥛');
    
    const resetSystem = () => ({
        stock: resetStock(),
        history: []
    });

    const recordHistory = (type, amount) => {
        // ...保持原有历史记录逻辑不变...
    };

    const render = () => {
        // ...保持原有渲染逻辑不变...
    };

    // 公共接口
    return { init };
})();

// 页面加载后启动
document.addEventListener('DOMContentLoaded', MilkManager.init);
