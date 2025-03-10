// ======================
// 配置区（务必修改！）
// ======================
const GIST_ID = '90fd281aaa471cf61066ddfd2bc97d4e'; // 替换为你的Gist ID
const INITIAL_MILK_COUNT = 0; // 初始牛奶瓶数

// ======================
// 核心逻辑
// ======================
const { createApp } = Vue;

const app = createApp({
  data() {
    return {
      gistData: {
        milk: [],
        history: [],
        undoStack: []
      },
      isLoading: true,
      errorMessage: ''
    };
  },

  computed: {
    milkCount() {
      return this.gistData.milk.length;
    }
  },

  async mounted() {
    console.log('🌱 应用初始化');
    await this.initializeData();
  },

  methods: {
    // ======================
    // 数据初始化
    // ======================
    async initializeData() {
      try {
        console.log('🔍 正在检查Token状态...');
        if (!window.__GIST_TOKEN__) {
          throw new Error('未检测到GitHub Token，请检查部署配置！');
        }

        console.log('📡 正在从Gist加载数据...');
        const data = await this.fetchGistData();
        
        // 首次使用初始化
        if (!data.milk || data.milk.length === 0) {
          console.log('🆕 检测到新用户，正在初始化数据...');
          this.gistData = this.createInitialData();
          await this.saveToGist();
        } else {
          this.gistData = data;
        }

        console.log('✅ 数据加载完成:', this.gistData);
      } catch (error) {
        console.error('❌ 初始化失败:', error);
        this.errorMessage = `初始化失败: ${error.message}`;
      } finally {
        this.isLoading = false;
      }
    },

    // ======================
    // 核心操作
    // ======================
    async drinkMilk() {
      try {
        if (this.milkCount === 0) return;

        const newData = {
          milk: this.gistData.milk.slice(1), // 移除第一瓶
          history: [
            ...this.gistData.history,
            {
              time: new Date().toISOString(),
              action: 'drink',
              count: this.milkCount - 1
            }
          ],
          undoStack: this.gistData.undoStack
        };

        await this.updateGist(newData);
        console.log('🥛 成功喝掉一瓶牛奶');
      } catch (error) {
        this.handleError('喝牛奶操作失败', error);
      }
    },

    async undo() {
      try {
        const lastAction = this.gistData.history[this.gistData.history.length - 1];
        if (!lastAction || lastAction.action === 'init') return;

        const undoData = {
          milk: [...this.gistData.milk, '🥛'], // 恢复一瓶
          history: this.gistData.history.slice(0, -1),
          undoStack: [...this.gistData.undoStack, lastAction]
        };

        await this.updateGist(undoData);
        console.log('↩️ 已撤销最后一次操作');
      } catch (error) {
        this.handleError('撤销操作失败', error);
      }
    },

    // ======================
    // API 交互
    // ======================
    async fetchGistData() {
      try {
        const response = await fetch(`https://api.github.com/gists/${GIST_ID}`, {
          headers: {
            Authorization: `Bearer ${window.__GIST_TOKEN__}`,
            'Accept': 'application/vnd.github.v3+json'
          }
        });

        if (!response.ok) {
          throw new Error(`Gist请求失败: ${response.status}`);
        }

        const gist = await response.json();
        return JSON.parse(gist.files['milkData.json'].content);
      } catch (error) {
        console.error('❌ 获取Gist数据失败:', error);
        throw error;
      }
    },

    async saveToGist(newData) {
      try {
        console.log('📡 正在保存数据:', newData);
        
        const response = await fetch(`https://api.github.com/gists/${GIST_ID}`, {
          method: 'PATCH',
          headers: {
            Authorization: `Bearer ${window.__GIST_TOKEN__}`,
            'Content-Type': 'application/json',
            'Accept': 'application/vnd.github.v3+json'
          },
          body: JSON.stringify({
            files: {
              "milkData.json": {
                content: JSON.stringify(newData, null, 2)
              }
            }
          })
        });

        console.log('🔧 响应状态:', response.status);
        const result = await response.json();
        console.log('🔧 完整响应:', result);

        if (!response.ok) {
          throw new Error(`保存失败: ${result.message}`);
        }

        this.gistData = newData;
        console.log('✅ 数据保存成功');
      } catch (error) {
        console.error('❌ 保存数据时出错:', error);
        throw error;
      }
    },

    // ======================
    // 工具方法
    // ======================
    createInitialData() {
      return {
        milk: Array(INITIAL_MILK_COUNT).fill('🥛'),
        history: [{
          time: new Date().toISOString(),
          action: 'init',
          count: INITIAL_MILK_COUNT
        }],
        undoStack: []
      };
    },

    handleError(context, error) {
      console.error(`❌ ${context}:`, error);
      this.errorMessage = `${context}: ${error.message}`;
      setTimeout(() => {
        this.errorMessage = '';
      }, 5000);
    },

    async updateGist(newData) {
      try {
        await this.saveToGist(newData);
        this.errorMessage = '';
      } catch (error) {
        this.handleError('网络同步失败', error);
      }
    }
  }
});

// ======================
// 启动应用
// ======================
app.mount('#app');
console.log('🚀 牛奶管家已启动');
