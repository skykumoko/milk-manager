// 简单易用的牛奶管理系统
const MilkManager = {
    data: {
        milk: ['🥛', '🥛', '🥛'], // 初始3瓶
        history: []
    },

    init() {
        this.render();
        this.bindEvents();
        console.log('系统已启动 🚀');
    },

    render() {
        // 更新牛奶显示
        document.querySelector('.milk-count').innerHTML = 
            `🥛 当前余量：${this.data.milk.length}包 
             ${this.data.milk.length <= 3 ? '<span class="warning">（该补货了！）</span>' : ''}`;

        // 更新图标
        const milkArea = document.querySelector('.milk-visual');
        milkArea.innerHTML = this.data.milk.map(() => '<div class="milk-item">🥛</div>').join('');

        // 更新历史记录
        const historyArea = document.querySelector('.history');
        historyArea.innerHTML = `
            <div class="history-title">📋 操作记录（最近5条）</div>
            ${this.data.history.slice(-5).map(record => `
                <div class="record-item ${record.type}">
                    ${record.type === 'add' ? '🛒' : '🥤'}
                    ${new Date(record.time).toLocaleString()} 
                    <span class="${record.type}-text">
                        ${record.type === 'add' ? '补货' : '喝掉'} ${record.amount} 包
                    </span>
                </div>
            `).join('') || '<div class="empty">~ 暂无记录 ~</div>'}
        `;
    },

    bindEvents() {
        // 补货按钮
        document.querySelectorAll('.add-btn').forEach(btn => {
            btn.onclick = () => this.addPack(parseInt(btn.textContent.match(/\d+/)[0]));
        });

        // 消耗按钮
        document.querySelectorAll('.remove-btn').forEach(btn => {
            btn.onclick = () => this.drinkMilk(parseInt(btn.textContent.match(/\d+/)[0]));
        });

        // 撤销按钮
        document.querySelector('.undo-btn').onclick = () => this.undo();
    },

    addPack(amount) {
        this.data.milk.push(...Array(amount).fill('🥛'));
        this.recordAction('add', amount);
        this.render();
    },

    drinkMilk(amount) {
        this.data.milk.splice(0, amount);
        this.recordAction('drink', amount);
        this.render();
    },

    undo() {
        if (this.data.history.length > 0) {
            const lastAction = this.data.history.pop();
            if (lastAction.type === 'add') {
                this.data.milk.splice(-lastAction.amount);
            } else {
                this.data.milk.unshift(...Array(lastAction.amount).fill('🥛'));
            }
            this.render();
        }
    },

    recordAction(type, amount) {
        this.data.history.push({
            type,
            amount,
            time: Date.now()
        });
    }
};

// 启动系统
window.onload = () => MilkManager.init();
