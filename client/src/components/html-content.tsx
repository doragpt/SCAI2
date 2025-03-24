import React from 'react';

interface HtmlContentProps {
  html: string;
  className?: string;
}

/**
 * HTMLコンテンツを安全に表示するコンポーネント
 * dangerouslySetInnerHTMLを使用して、HTMLタグをレンダリングします
 */
export function HtmlContent({ html, className = '' }: HtmlContentProps) {
  return (
    <div 
      className={`html-content ${className}`}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}