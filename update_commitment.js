#!/usr/bin/env node

import fs from 'fs';

// 修正対象のファイル
const filePath = './client/src/pages/store-dashboard.tsx';

try {
  // ファイルを読み込む
  let content = fs.readFileSync(filePath, 'utf8');
  
  // 重複したcommitmentフィールドを修正
  const regex = /commitment: profile\?\.commitment \|\| "",\s+security_measures: profile\?\.security_measures \|\| "",\s+commitment: profile\?\.commitment \|\| "",/g;
  
  // 置換して重複を削除
  const modified = content.replace(regex, 
    `commitment: profile?.commitment || "",
        security_measures: profile?.security_measures || "",`);
  
  // ファイルに書き戻す
  fs.writeFileSync(filePath, modified, 'utf8');
  
  console.log('重複フィールドが正常に修正されました。');
} catch (error) {
  console.error('ファイルの更新に失敗しました:', error);
}
