import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import reportWebVitals from './reportWebVitals';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// アプリのパフォーマンス計測を始める場合は、結果を記録する関数を渡します。
// 例: reportWebVitals(console.log)
// 分析エンドポイントへ送信することもできます。詳細: https://bit.ly/CRA-vitals
reportWebVitals();
