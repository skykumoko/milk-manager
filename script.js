// 牛奶管家完整功能版 (含数据持久化)
const MilkManager = {
    data: {
        milk: Array(3).fill('🥛'), // 初始3包
        history: [],
        lastUpdate: Date.now()
    },

    // 初始化系统
    init() {
        this.loadData();
        this.setupEventListeners();
        this.updateUI();
        this.checkStorage();
        console.log('🥛 牛奶管家已启动');
    },

    // 加载本地数据
    loadData() {
        const savedData = localStorage.getItem('milkData');
        if (savedData) {
            try {
                const parsed = JSON.parse(savedData);
                this.data = {
                    ...this.data,
                    ...parsed,
                    milk: parsed.milk || this.data.milk
                };
            } catch(e) {
                console.error('数据加载失败，使用默认值:', e);
            }
        }
    },

    // 保存数据到本地
    saveData() {
        localStorage.setItem('milkData', JSON.stringify({
            milk: this.data.milk,
            history: this.data.history.slice(-50), // 最多保留50条记录
            lastUpdate: Date.now()
        }));
    },

    // 事件监听设置
    setupEventListeners() {
        // 补货按钮
        document.querySelectorAll('.add-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const amount = parseInt(btn.dataset.amount);
                this.handleAdd(amount);
            });
        });

        // 消耗按钮
        document.querySelectorAll('.remove-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const amount = parseInt(btn.dataset.amount);
                this.handleDrink(amount);
            });
        });

        // 撤销按钮
        document.getElementById('undoBtn').addEventListener('click', () => this.undoAction());
    },

    // 处理补货
    handleAdd(amount) {
        this.data.milk.push(...Array(amount).fill('🥛'));
        this.recordHistory('add', amount);
        this.updateSystem();
    },

    // 处理消耗
    handleDrink(amount) {
        if (amount > this.data.milk.length) {
            alert('库存不足！');
            return;
        }
        this.data.milk.splice(0, amount);
        this.recordHistory('drink', amount);
        this.updateSystem();
    },

    // 
