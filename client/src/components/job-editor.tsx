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
              }
            } catch (error) {
              console.error('画像アップロードエラー:', error);
            } finally {
              setIsLoading(false);
            }
          }
        };
      });
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
          画像やフォーマットを活用して店舗の魅力を表現できます
        </div>
      </div>
    </div>
  );
}