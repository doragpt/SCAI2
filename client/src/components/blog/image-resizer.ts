/**
 * Quillエディター用のカスタム画像リサイズ機能
 */

// リサイズ関連の状態を管理するクラス
export class ImageResizer {
  private editor: HTMLElement;
  private activeImage: HTMLImageElement | null = null;
  private initialWidth: number = 0;
  private initialHeight: number = 0;
  private initialX: number = 0;
  private initialY: number = 0;
  private resizing: boolean = false;
  private corner: string = '';
  private handles: HTMLDivElement[] = [];
  
  // バインドされたイベントハンドラへの参照（クリーンアップ用）
  private boundMouseMove: (e: MouseEvent) => void;
  private boundMouseUp: (e: MouseEvent) => void;
  
  constructor(editorElement: HTMLElement) {
    this.editor = editorElement;
    
    // イベントハンドラをバインドして保存（メモリリーク防止のため）
    this.boundMouseMove = this.handleMouseMove.bind(this);
    this.boundMouseUp = this.handleMouseUp.bind(this);
    
    this.init();
  }

  // 初期化関数
  private init(): void {
    // エディタ内の既存画像に対して処理
    this.processExistingImages();
    
    // エディタへの画像追加を監視（MutationObserver）
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.type === 'childList') {
          mutation.addedNodes.forEach((node) => {
            if (node.nodeType === Node.ELEMENT_NODE) {
              const element = node as HTMLElement;
              // 追加された要素内の画像をすべて検索
              const images = element.querySelectorAll('img');
              images.forEach((img) => this.setupImage(img as HTMLImageElement));
            }
          });
        }
      });
    });
    
    // オブザーバーを開始
    observer.observe(this.editor, { childList: true, subtree: true });
    
    // グローバルマウスイベントハンドラを追加
    document.addEventListener('mousemove', this.boundMouseMove);
    document.addEventListener('mouseup', this.boundMouseUp);
  }

  // 既存の画像を処理
  private processExistingImages(): void {
    const images = this.editor.querySelectorAll('img');
    images.forEach((img) => this.setupImage(img as HTMLImageElement));
  }

  // 画像にリサイズ機能を追加
  private setupImage(img: HTMLImageElement): void {
    if (img.hasAttribute('data-resizable')) return; // 既に処理済みの画像はスキップ
    
    // リサイズ可能なマークを追加
    img.setAttribute('data-resizable', 'true');
    
    // スタイルクラスを追加（CSSとの整合性を保つ）
    img.classList.add('resizable-image');
    
    // クリックイベントでアクティブにする
    img.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      console.log('画像がクリックされました - リサイズハンドルを表示します');
      this.activateImage(img);
    });
  }

  // 画像をアクティブ化（リサイズハンドルを表示）
  private activateImage(img: HTMLImageElement): void {
    // 以前のアクティブ画像をクリア
    this.clearActiveImage();
    
    this.activeImage = img;
    
    // リサイズハンドルを追加
    this.addResizeHandles();
  }

  // アクティブな画像をクリア
  private clearActiveImage(): void {
    if (this.activeImage) {
      this.activeImage.classList.remove('resizing');
    }
    
    // ハンドルを削除
    this.handles.forEach(handle => {
      if (handle.parentNode) {
        handle.parentNode.removeChild(handle);
      }
    });
    
    this.handles = [];
    this.activeImage = null;
  }

  // リサイズハンドルを追加
  private addResizeHandles(): void {
    if (!this.activeImage) return;
    
    const positions = ['nw', 'ne', 'sw', 'se'];
    
    positions.forEach(pos => {
      const handle = document.createElement('div');
      handle.className = `quill-resize-handle ${pos}`;
      
      // ハンドルのマウスダウンイベント
      handle.addEventListener('mousedown', (e) => {
        e.preventDefault();
        e.stopPropagation();
        
        if (!this.activeImage) return;
        
        this.startResize(e, pos);
      });
      
      // 親要素が確実に存在する場合のみ追加
      if (this.activeImage) {
        const parentNode = this.activeImage.parentNode;
        if (parentNode) {
          parentNode.appendChild(handle);
          this.handles.push(handle);
          
          // ハンドルの位置を調整
          this.updateHandlePosition(handle, pos);
        }
      }
    });
  }

  // ハンドルの位置を更新
  private updateHandlePosition(handle: HTMLDivElement, pos: string): void {
    if (!this.activeImage) return;
    
    // 親要素が存在しない場合は処理をスキップ
    const parentElement = this.activeImage.parentElement;
    if (!parentElement) return;
    
    const rect = this.activeImage.getBoundingClientRect();
    const parentRect = parentElement.getBoundingClientRect();
    
    const top = rect.top - parentRect.top;
    const left = rect.left - parentRect.left;
    
    switch (pos) {
      case 'nw':
        handle.style.top = `${top}px`;
        handle.style.left = `${left}px`;
        break;
      case 'ne':
        handle.style.top = `${top}px`;
        handle.style.left = `${left + rect.width}px`;
        break;
      case 'sw':
        handle.style.top = `${top + rect.height}px`;
        handle.style.left = `${left}px`;
        break;
      case 'se':
        handle.style.top = `${top + rect.height}px`;
        handle.style.left = `${left + rect.width}px`;
        break;
    }
  }

  // リサイズ開始
  private startResize(e: MouseEvent, corner: string): void {
    if (!this.activeImage) return;
    
    this.resizing = true;
    this.corner = corner;
    this.activeImage.classList.add('resizing');
    
    this.initialWidth = this.activeImage.width;
    this.initialHeight = this.activeImage.height;
    this.initialX = e.clientX;
    this.initialY = e.clientY;
    
    // 初期サイズをdata属性に保存（リサイズ前の状態）
    if (!this.activeImage.hasAttribute('data-width')) {
      this.activeImage.setAttribute('data-width', String(this.initialWidth));
    }
    if (!this.activeImage.hasAttribute('data-height')) {
      this.activeImage.setAttribute('data-height', String(this.initialHeight));
    }
  }

  // マウス移動中のイベント処理
  private handleMouseMove(e: MouseEvent): void {
    if (!this.resizing || !this.activeImage) return;
    
    e.preventDefault();
    
    const deltaX = e.clientX - this.initialX;
    const deltaY = e.clientY - this.initialY;
    
    let newWidth = this.initialWidth;
    let newHeight = this.initialHeight;
    
    // コーナー位置に応じてサイズ調整
    switch(this.corner) {
      case 'se':
        newWidth = this.initialWidth + deltaX;
        newHeight = this.initialHeight + deltaY;
        break;
      case 'sw':
        newWidth = this.initialWidth - deltaX;
        newHeight = this.initialHeight + deltaY;
        break;
      case 'ne':
        newWidth = this.initialWidth + deltaX;
        newHeight = this.initialHeight - deltaY;
        break;
      case 'nw':
        newWidth = this.initialWidth - deltaX;
        newHeight = this.initialHeight - deltaY;
        break;
    }
    
    // サイズ制限
    newWidth = Math.max(50, newWidth);  // 最小幅: 50px
    newHeight = Math.max(50, newHeight); // 最小高さ: 50px
    
    // アスペクト比を維持（オプション）
    // const aspectRatio = this.initialWidth / this.initialHeight;
    // newHeight = newWidth / aspectRatio;
    
    // 画像サイズを更新
    this.resizeImage(newWidth, newHeight);
  }

  // マウスボタンを離したときの処理
  private handleMouseUp(e: MouseEvent): void {
    if (!this.resizing) return;
    
    e.preventDefault();
    this.resizing = false;
    
    if (this.activeImage) {
      this.activeImage.classList.remove('resizing');
      
      // サイズを属性とスタイルの両方に反映
      const width = this.activeImage.width;
      const height = this.activeImage.height;
      
      this.activeImage.setAttribute('width', String(width));
      this.activeImage.setAttribute('data-width', String(width));
      this.activeImage.setAttribute('height', String(height));
      this.activeImage.setAttribute('data-height', String(height));
      
      // スタイルでも設定
      this.activeImage.style.width = `${width}px`;
      this.activeImage.style.height = `${height}px`;
      
      // ハンドル位置を更新
      this.handles.forEach((handle, index) => {
        const positions = ['nw', 'ne', 'sw', 'se'];
        this.updateHandlePosition(handle, positions[index]);
      });
      
      // カスタムイベントを発火（エディタがサイズ変更を検知できるように）
      const event = new CustomEvent('image-resize', {
        detail: {
          element: this.activeImage,
          width,
          height
        }
      });
      this.editor.dispatchEvent(event);
    }
  }

  // 画像サイズを変更
  private resizeImage(width: number, height: number): void {
    if (!this.activeImage) return;
    
    this.activeImage.width = width;
    this.activeImage.height = height;
    
    // ハンドル位置を更新
    this.handles.forEach((handle, index) => {
      const positions = ['nw', 'ne', 'sw', 'se'];
      this.updateHandlePosition(handle, positions[index]);
    });
  }

  // 画像を解除（エディター離脱時などに呼び出す）
  public destroy(): void {
    this.clearActiveImage();
    
    // 保存しておいたバインド済み関数を使用してイベントリスナーを削除
    document.removeEventListener('mousemove', this.boundMouseMove);
    document.removeEventListener('mouseup', this.boundMouseUp);
  }
}