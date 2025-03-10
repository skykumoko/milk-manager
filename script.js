const { createApp } = Vue;
const GIST_ID = '90fd281aaa471cf61066ddfd2bc97d4e';

// 安全访问全局变量（与Actions注入的名称一致）
const GIST_TOKEN = window.__GIST_TOKEN__ || '';

createApp({
    data() {
        return {
            milkArray: [],
            history: [],      // 统一操作记录
            undoStack: []     // 撤销栈
        }
    },
    computed: {
        // 显示最近5条记录
        limitedHistory() {
            return this.history.slice(0, 5);
        },
        // 是否可以撤销
        canUndo() {
            return this.undoStack.length > 0;
        }
    },
    methods: {
        // 补货方法
        addPack(num) {
            this.saveState(); // 保存当前状态
            
            this.milkArray.push(...Array(num).fill('🥛'));
            this.history.unshift(this.createRecord('add', num));
            this.truncateHistory();
            this.saveData();
        },

        // 消耗方法
        drinkMilk(amount) {
            if (this.milkArray.length < amount) {
                alert(`库存不足！当前余量：${this.milkArray.length}包`);
                return;
            }

            this.saveState(); // 保存当前状态
            
            this.milkArray.splice(-amount, amount);
            this.history.unshift(this.createRecord('drink', amount));
            this.truncateHistory();
            this.saveData();
        },

        // 创建记录
        createRecord(type, amount) {
            const now = new Date();
            return {
                type: type,
                amount: amount,
                time: `${now.getFullYear()}/${
                    (now.getMonth()+1).toString().padStart(2,'0')}/${
                    now.getDate().toString().padStart(2,'0')} ${
                    now.getHours().toString().padStart(2,'0')}:${
                    now.getMinutes().toString().padStart(2,'0')}`
            };
        },

        // 保持最多5条记录
        truncateHistory() {
            if (this.history.length > 5) {
                this.history = this.history.slice(0, 5);
            }
        },

        // 保存状态用于撤销
        saveState() {
            this.undoStack.push({
                milk: [...this.milkArray],
                history: [...this.history]
            });
        },

        // 撤销操作
        undo() {
            if (!this.canUndo) return;
            
            const prevState = this.undoStack.pop();
            this.milkArray = prevState.milk;
            this.history = prevState.history;
            this.saveData();
        },

        // 保存数据
        saveData() {
            localStorage.setItem('milkData', JSON.stringify({
                milk: this.milkArray,
                history: this.history,
                undoStack: this.undoStack
            }));
        }
    },
    mounted() {
        // 加载保存的数据
        const saved = localStorage.getItem('milkData');
        if (saved) {
            const data = JSON.parse(saved);
            this.milkArray = data.milk || [];
            this.history = data.history || [];
            this.undoStack = data.undoStack || [];
        }
    }
}).mount('#app');
