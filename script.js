async saveToGist() {
  if (!window.__GIST_TOKEN__) {
    alert('未检测到Token，请检查部署配置！');
    return;
  }
  
  const res = await fetch(`https://api.github.com/gists/${GIST_ID}`, {
    method: 'PATCH',
    headers: {
      Authorization: `Bearer ${window.__GIST_TOKEN__}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ /*...*/ })
  });
  // ...后续处理
}
