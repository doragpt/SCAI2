/**
 * 画像プロパティダイアログのユーティリティ
 */

/**
 * 画像プロパティダイアログを表示する
 * @param img 対象の画像要素
 * @param onSave 保存時のコールバック関数
 */
export function showImagePropertiesDialog(
  img: HTMLImageElement, 
  onSave: (width: number, height: number) => void
) {
  console.log('画像プロパティダイアログを表示します', img.src.substring(0, 30) + '...');
  
  // 現在の画像の情報を取得
  const currentWidth = img.width;
  const currentHeight = img.height;
  const aspectRatio = currentWidth / currentHeight;
  
  // ダイアログを作成
  const dialog = document.createElement('div');
  dialog.className = 'image-properties-dialog';
  dialog.style.position = 'fixed';
  dialog.style.top = '50%';
  dialog.style.left = '50%';
  dialog.style.transform = 'translate(-50%, -50%)';
  dialog.style.backgroundColor = 'white';
  dialog.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.15)';
  dialog.style.padding = '20px';
  dialog.style.borderRadius = '8px';
  dialog.style.zIndex = '10001';
  dialog.style.minWidth = '320px';
  dialog.style.maxWidth = '90vw';
  dialog.style.fontFamily = 'system-ui, -apple-system, sans-serif';
  
  // ダイアログのタイトル
  const title = document.createElement('h3');
  title.textContent = '画像プロパティ';
  title.style.margin = '0 0 16px 0';
  title.style.padding = '0 0 8px 0';
  title.style.borderBottom = '1px solid #eee';
  title.style.fontSize = '18px';
  title.style.fontWeight = '600';
  title.style.color = '#111';
  dialog.appendChild(title);
  
  // サイズフォームを作成
  const dialogForm = document.createElement('form');
  dialogForm.onsubmit = (formEvent) => {
    formEvent.preventDefault();
    return false;
  };
  
  // サイズの入力フィールドを作成
  const sizePart = document.createElement('div');
  sizePart.style.marginBottom = '16px';
  
  const sizeLabel = document.createElement('div');
  sizeLabel.textContent = 'サイズ';
  sizeLabel.style.fontWeight = '500';
  sizeLabel.style.marginBottom = '8px';
  sizePart.appendChild(sizeLabel);
  
  const sizeInputs = document.createElement('div');
  sizeInputs.style.display = 'flex';
  sizeInputs.style.gap = '8px';
  sizeInputs.style.alignItems = 'center';
  
  // 幅の入力フィールド
  const widthWrapper = document.createElement('div');
  widthWrapper.style.flex = '1';
  
  const widthLabel = document.createElement('label');
  widthLabel.textContent = '幅';
  widthLabel.style.display = 'block';
  widthLabel.style.marginBottom = '4px';
  widthLabel.style.fontSize = '12px';
  widthLabel.style.color = '#555';
  widthWrapper.appendChild(widthLabel);
  
  const widthInput = document.createElement('input');
  widthInput.type = 'number';
  widthInput.min = '50';
  widthInput.max = '1200';
  widthInput.value = currentWidth.toString();
  widthInput.style.width = '100%';
  widthInput.style.padding = '8px';
  widthInput.style.border = '1px solid #ddd';
  widthInput.style.borderRadius = '4px';
  widthInput.style.fontSize = '14px';
  widthWrapper.appendChild(widthInput);
  sizeInputs.appendChild(widthWrapper);
  
  // x（✕）記号
  const xSign = document.createElement('span');
  xSign.textContent = '✕';
  xSign.style.color = '#777';
  sizeInputs.appendChild(xSign);
  
  // 高さの入力フィールド
  const heightWrapper = document.createElement('div');
  heightWrapper.style.flex = '1';
  
  const heightLabel = document.createElement('label');
  heightLabel.textContent = '高さ';
  heightLabel.style.display = 'block';
  heightLabel.style.marginBottom = '4px';
  heightLabel.style.fontSize = '12px';
  heightLabel.style.color = '#555';
  heightWrapper.appendChild(heightLabel);
  
  const heightInput = document.createElement('input');
  heightInput.type = 'number';
  heightInput.min = '50';
  heightInput.max = '1200';
  heightInput.value = currentHeight.toString();
  heightInput.style.width = '100%';
  heightInput.style.padding = '8px';
  heightInput.style.border = '1px solid #ddd';
  heightInput.style.borderRadius = '4px';
  heightInput.style.fontSize = '14px';
  heightWrapper.appendChild(heightInput);
  sizeInputs.appendChild(heightWrapper);
  
  sizePart.appendChild(sizeInputs);
  
  // アスペクト比維持のチェックボックス
  const aspectRatioWrapper = document.createElement('div');
  aspectRatioWrapper.style.marginTop = '8px';
  aspectRatioWrapper.style.display = 'flex';
  aspectRatioWrapper.style.alignItems = 'center';
  aspectRatioWrapper.style.gap = '4px';
  
  const aspectRatioCheckbox = document.createElement('input');
  aspectRatioCheckbox.type = 'checkbox';
  aspectRatioCheckbox.id = 'aspectRatio';
  aspectRatioCheckbox.checked = true;
  aspectRatioWrapper.appendChild(aspectRatioCheckbox);
  
  const aspectRatioLabel = document.createElement('label');
  aspectRatioLabel.textContent = 'アスペクト比を維持する';
  aspectRatioLabel.htmlFor = 'aspectRatio';
  aspectRatioLabel.style.fontSize = '14px';
  aspectRatioLabel.style.color = '#555';
  aspectRatioWrapper.appendChild(aspectRatioLabel);
  
  sizePart.appendChild(aspectRatioWrapper);
  dialogForm.appendChild(sizePart);
  
  // 幅が変更されたときのイベント
  widthInput.addEventListener('input', () => {
    if (aspectRatioCheckbox.checked) {
      const newWidth = parseInt(widthInput.value) || currentWidth;
      const newHeight = Math.round(newWidth / aspectRatio);
      heightInput.value = newHeight.toString();
    }
  });
  
  // 高さが変更されたときのイベント
  heightInput.addEventListener('input', () => {
    if (aspectRatioCheckbox.checked) {
      const newHeight = parseInt(heightInput.value) || currentHeight;
      const newWidth = Math.round(newHeight * aspectRatio);
      widthInput.value = newWidth.toString();
    }
  });
  
  // ボタン
  const buttonWrapper = document.createElement('div');
  buttonWrapper.style.display = 'flex';
  buttonWrapper.style.justifyContent = 'flex-end';
  buttonWrapper.style.gap = '8px';
  buttonWrapper.style.marginTop = '16px';
  
  // キャンセルボタン
  const cancelButton = document.createElement('button');
  cancelButton.textContent = 'キャンセル';
  cancelButton.type = 'button';
  cancelButton.style.padding = '8px 16px';
  cancelButton.style.border = '1px solid #ddd';
  cancelButton.style.borderRadius = '4px';
  cancelButton.style.backgroundColor = '#f9f9f9';
  cancelButton.style.cursor = 'pointer';
  cancelButton.style.fontSize = '14px';
  cancelButton.onclick = () => {
    document.body.removeChild(dialog);
  };
  buttonWrapper.appendChild(cancelButton);
  
  // OKボタン
  const okButton = document.createElement('button');
  okButton.textContent = 'OK';
  okButton.type = 'button';
  okButton.style.padding = '8px 16px';
  okButton.style.border = '1px solid #2563eb';
  okButton.style.borderRadius = '4px';
  okButton.style.backgroundColor = '#2563eb';
  okButton.style.color = 'white';
  okButton.style.cursor = 'pointer';
  okButton.style.fontSize = '14px';
  okButton.onclick = () => {
    // 新しいサイズを取得
    const newWidth = parseInt(widthInput.value) || currentWidth;
    const newHeight = parseInt(heightInput.value) || currentHeight;
    
    // コールバック関数を呼び出して保存
    onSave(newWidth, newHeight);
    
    // ダイアログを閉じる
    document.body.removeChild(dialog);
  };
  buttonWrapper.appendChild(okButton);
  
  dialogForm.appendChild(buttonWrapper);
  dialog.appendChild(dialogForm);
  
  // ダイアログをbodyに追加
  document.body.appendChild(dialog);
}