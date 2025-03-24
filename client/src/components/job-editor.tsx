import { useState, useEffect, useRef } from 'react';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import { Button } from "@/components/ui/button";
import { Loader2 } from 'lucide-react';

// Quillエディターのツールバーオプション
const TOOLBAR_OPTIONS = [
  [{ header: [1, 2, 3, 4, 5, 6, false] }],
  ['bold', 'italic', 'underline', 'strike'],
  [{ color: [] }, { background: [] }],
  [{ list: 'ordered' }, { list: 'bullet' }],
  [{ indent: '-1' }, { indent: '+1' }],
  [{ align: [] }],
  ['link', 'image'],
  ['clean']
];

// Quillエディターのモジュール設定
const MODULES = {
  toolbar: {
    container: TOOLBAR_OPTIONS,
    handlers: {}
  },
  clipboard: {
    matchVisual: false
  }
};

interface JobEditorProps {
  initialValue?: string;
  onChange: (content: string) => void;
  placeholder?: string;
  maxLength?: number;
}

export function JobEditor({ initialValue = '', onChange, placeholder = 'お仕事の内容を入力してください', maxLength = 9000 }: JobEditorProps) {
  // カスタムCSS - ReactQuillのスタイルを調整
  useEffect(() => {
    // エディタのスタイルカスタマイズ
    const style = document.createElement('style');
    style.innerHTML = `
      .job-editor .ql-editor {
        min-height: 200px;
        max-height: 500px;
        overflow-y: auto;
        font-size: 1rem;
        line-height: 1.5;
        padding: 0.75rem;
      }
      .job-editor .ql-toolbar {
        border-top-left-radius: 0.375rem;
        border-top-right-radius: 0.375rem;
        background-color: #f9fafb;
        border-color: #e5e7eb;
        padding: 0.5rem;
      }
      .job-editor .ql-container {
        border-bottom-left-radius: 0.375rem;
        border-bottom-right-radius: 0.375rem;
        border-color: #e5e7eb;
        font-family: inherit;
      }
      .job-editor .ql-editor img {
        max-width: 100%;
        height: auto;
        margin: 0.5rem 0;
        display: block;
      }
      .image-resizer {
        box-shadow: 0 0 4px 1px rgba(0, 0, 0, 0.3);
        background-color: #ffffff;
      }
      .image-resizer:hover {
        background-color: #1e88e5;
      }
      .job-editor .ql-editor p {
        margin-bottom: 0.5rem;
      }
      .job-editor .ql-editor h1, .job-editor .ql-editor h2, .job-editor .ql-editor h3 {
        margin-top: 1rem;
        margin-bottom: 0.5rem;
        font-weight: 600;
      }
      .job-editor .ql-editor ul, .job-editor .ql-editor ol {
        padding-left: 1.5rem;
        margin-bottom: 0.5rem;
      }
      .job-editor .ql-snow.ql-toolbar button:hover, 
      .job-editor .ql-snow .ql-toolbar button:hover, 
      .job-editor .ql-snow.ql-toolbar button.ql-active, 
      .job-editor .ql-snow .ql-toolbar button.ql-active {
        background-color: rgba(0, 0, 0, 0.06);
      }
    `;
    document.head.appendChild(style);
    
    return () => {
      document.head.removeChild(style);
    };
  }, []);
  const [value, setValue] = useState(initialValue);
  const [charCount, setCharCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const quillRef = useRef<ReactQuill>(null);

  // テキストの文字数をカウント（HTMLタグを除く）
  const countCharacters = (html: string) => {
    const tmp = document.createElement('div');
    tmp.innerHTML = html;
    const text = tmp.textContent || tmp.innerText || '';
    return text.length;
  };

  useEffect(() => {
    if (initialValue) {
      setValue(initialValue);
      setCharCount(countCharacters(initialValue));
    }
  }, [initialValue]);

  // 画像をリサイズする機能
  const setupImageResizer = () => {
    if (!quillRef.current) return;
    
    const editorContainer = quillRef.current.getEditor().root;
    
    // 既存のリサイザーを削除
    const existingResizers = editorContainer.querySelectorAll('.image-resizer');
    existingResizers.forEach(resizer => resizer.remove());
    
    // 全ての画像に対してリサイザーを設定
    const images = editorContainer.querySelectorAll('img');
    images.forEach((img: HTMLImageElement) => {
      setupImageControls(img);
    });
  };

  // 画像用のリサイズコントロールを追加
  const setupImageControls = (img: HTMLImageElement) => {
    // 画像がすでにリサイザーを持っている場合はスキップ
    if (img.parentElement?.querySelector('.image-resizer')) return;
    
    // 画像の親要素に相対位置設定
    if (img.parentElement) {
      img.parentElement.style.position = 'relative';
      img.parentElement.style.display = 'inline-block';
    }
    
    // リサイズハンドルを追加
    const resizeHandle = document.createElement('div');
    resizeHandle.className = 'image-resizer';
    resizeHandle.style.position = 'absolute';
    resizeHandle.style.right = '0';
    resizeHandle.style.bottom = '0';
    resizeHandle.style.width = '14px';
    resizeHandle.style.height = '14px';
    resizeHandle.style.border = '2px solid #1e88e5';
    resizeHandle.style.borderTop = 'none';
    resizeHandle.style.borderLeft = 'none';
    resizeHandle.style.cursor = 'se-resize';
    resizeHandle.style.zIndex = '2';
    resizeHandle.title = '画像のサイズを変更できます';
    
    // 画像クリック時のコントロール表示
    img.onclick = () => {
      // 他の画像のリサイズハンドルを非表示
      const allResizers = quillRef.current?.getEditor().root.querySelectorAll('.image-resizer') as NodeListOf<HTMLElement>;
      allResizers?.forEach(r => r.style.display = 'none');
      
      // この画像のリサイズハンドルを表示
      if (img.parentElement?.querySelector('.image-resizer')) {
        (img.parentElement.querySelector('.image-resizer') as HTMLElement).style.display = 'block';
      }
    };
    
    // ドラッグでリサイズするイベント設定
    let startX: number, startY: number, startWidth: number, startHeight: number;
    
    const startResize = (e: MouseEvent) => {
      e.preventDefault();
      startX = e.clientX;
      startY = e.clientY;
      startWidth = img.width;
      startHeight = img.height;
      document.addEventListener('mousemove', resize);
      document.addEventListener('mouseup', stopResize);
    };
    
    const resize = (e: MouseEvent) => {
      const width = startWidth + (e.clientX - startX);
      const height = startHeight + (e.clientY - startY);
      
      // 最小サイズを設定
      if (width > 50 && height > 50) {
        img.width = width;
        img.height = height;
      }
    };
    
    const stopResize = () => {
      document.removeEventListener('mousemove', resize);
      document.removeEventListener('mouseup', stopResize);
    };
    
    resizeHandle.addEventListener('mousedown', startResize);
    
    // 画像の親要素にリサイズハンドルを追加
    if (img.parentElement) {
      img.parentElement.appendChild(resizeHandle);
    }
    
    // 初期状態ではリサイズハンドルを非表示
    resizeHandle.style.display = 'none';
  };

  // クリック以外の場所をクリックしたときにリサイズハンドルを非表示
  useEffect(() => {
    const handleDocumentClick = (e: MouseEvent) => {
      if (quillRef.current) {
        const editorElement = quillRef.current.getEditor().root;
        const target = e.target as HTMLElement;
        
        // 画像やリサイザー以外をクリックした場合、すべてのリサイザーを非表示
        if (!target.closest('img') && !target.closest('.image-resizer')) {
          const allResizers = editorElement.querySelectorAll('.image-resizer') as NodeListOf<HTMLElement>;
          allResizers.forEach(r => {
            r.style.display = 'none';
          });
        }
      }
    };
    
    document.addEventListener('click', handleDocumentClick);
    return () => {
      document.removeEventListener('click', handleDocumentClick);
    };
  }, []);

  useEffect(() => {
    if (quillRef.current) {
      const quill = quillRef.current.getEditor();
      
      // 画像ハンドラーを設定
      const toolbar = quill.getModule('toolbar');
      toolbar.addHandler('image', () => {
        const input = document.createElement('input');
        input.setAttribute('type', 'file');
        input.setAttribute('accept', 'image/*');
        input.click();

        input.onchange = async () => {
          if (input.files && input.files[0]) {
            const file = input.files[0];
            setIsLoading(true);
            
            try {
              // FormDataを準備
              const formData = new FormData();
              formData.append('file', file);
              
              // ファイルをアップロード
              const response = await fetch('/api/upload', {
                method: 'POST',
                body: formData
              });
              
              if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.message || '画像のアップロードに失敗しました');
              }
              
              const data = await response.json();
              // Quillのエディタ位置を取得して画像を挿入
              const range = quill.getSelection();
              if (range) {
                // TS型エラー回避のため型アサーション使用
                const rangeIndex = range.index as number;
                quill.insertEmbed(rangeIndex, 'image', data.url);
                quill.setSelection(rangeIndex + 1, 0);
                
                // 少し遅延させてから画像リサイザーをセットアップ
                setTimeout(() => {
                  setupImageResizer();
                }, 100);
              }
            } catch (error) {
              console.error('画像アップロードエラー:', error);
            } finally {
              setIsLoading(false);
            }
          }
        };
      });
      
      // エディターの内容変更時に画像リサイザーをセットアップ
      quill.on('text-change', () => {
        setTimeout(() => {
          setupImageResizer();
        }, 100);
      });
      
      // 初期ロード時にも画像リサイザーをセットアップ
      if (initialValue) {
        setTimeout(() => {
          setupImageResizer();
        }, 100);
      }
    }
  }, []);

  const handleChange = (content: string) => {
    const newCharCount = countCharacters(content);
    if (maxLength && newCharCount > maxLength) {
      return;
    }
    
    setValue(content);
    setCharCount(newCharCount);
    onChange(content);
  };

  return (
    <div className="job-editor">
      <div className="relative">
        <ReactQuill
          ref={quillRef}
          value={value}
          onChange={handleChange}
          modules={MODULES}
          placeholder={placeholder}
          theme="snow"
          className="min-h-[200px]"
        />
        {isLoading && (
          <div className="absolute inset-0 bg-black/10 flex items-center justify-center z-10">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        )}
      </div>
      <div className="flex justify-between text-sm mt-2">
        <div className={`text-muted-foreground ${charCount > maxLength ? 'text-red-500' : ''}`}>
          {charCount}/{maxLength}文字
        </div>
        <div className="text-muted-foreground italic">
          画像やフォーマットを活用して店舗の魅力を表現できます（画像をクリックするとリサイズ可能）
        </div>
      </div>
    </div>
  );
}