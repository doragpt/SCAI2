/**
 * カスタム画像アップロードアダプター
 * CKEditorからのアップロードリクエストを処理し、サーバーにファイルを送信する
 */
export class CustomUploadAdapter {
  private loader: any;
  private abortController: AbortController | null = null;

  constructor(loader: any) {
    // ファイルローダーインスタンス
    this.loader = loader;
  }

  /**
   * ファイルのアップロードを開始
   * @returns {Promise} アップロード結果を含むPromise
   */
  async upload(): Promise<{ default: string }> {
    try {
      // ファイルをローダーから取得
      const file = await this.loader.file;
      
      // アップロードをキャンセルできるようにAbortControllerを作成
      this.abortController = new AbortController();
      
      // FormDataを準備
      const formData = new FormData();
      formData.append('file', file);
      
      // ファイルをアップロード
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
        signal: this.abortController.signal
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || '画像のアップロードに失敗しました');
      }
      
      const data = await response.json();
      
      console.log('画像アップロード成功:', data.url);
      
      // CKEditorが期待する形式でURLを返す
      return {
        default: data.url
      };
    } catch (error) {
      console.error('画像アップロードエラー:', error);
      throw error;
    }
  }

  /**
   * アップロードをキャンセル
   */
  abort(): void {
    if (this.abortController) {
      this.abortController.abort();
    }
  }
}

/**
 * アップロードアダプタープラグイン
 * @param editor CKEditorインスタンス
 */
export function CustomUploadAdapterPlugin(editor: any) {
  editor.plugins.get('FileRepository').createUploadAdapter = (loader: any) => {
    return new CustomUploadAdapter(loader);
  };
}