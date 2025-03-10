// 牛奶管家完整代码 (安全版)
const MILK_DATA = {
  milk: ['🥛', '🥛', '🥛'], // 初始3瓶牛奶
  history: [],
  version: '1.0'
};

// 简单显示牛奶数量
document.getElementById('milk-count').textContent = MILK_DATA.milk.length;

// 喝牛奶按钮功能
document.getElementById('drink-btn').onclick = () => {
  if (MILK_DATA.milk.length > 0) {
    MILK_DATA.milk.pop(); // 减少一瓶
    document.getElementById('milk-count').textContent = MILK_DATA.milk.length;
  }
};

// 重置按钮功能
document.getElementById('reset-btn').onclick = () => {
  MILK_DATA.milk = ['🥛', '🥛', '🥛'];
  document.getElementById('milk-count').textContent = 3;
};
