import { MessageSquare, Link as LinkIcon, ExternalLink, Instagram, Twitter, Facebook, Youtube } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { FaLine } from 'react-icons/fa';

interface SNSLink {
  platform: string;
  url: string;
  text?: string;
}

interface SNSLinksDisplayProps {
  links: SNSLink[];
  snsId?: string;
  snsText?: string;
  snsUrl?: string;
  className?: string;
  textColor?: string;
}

/**
 * SNSリンク表示コンポーネント
 * 店舗プロフィールのSNSアカウント情報を表示します
 */
export function SNSLinksDisplay({
  links,
  snsId,
  snsText,
  snsUrl,
  className = '',
  textColor = '#333333'
}: SNSLinksDisplayProps) {
  if ((!links || links.length === 0) && !snsId && !snsUrl) {
    return null;
  }

  // プラットフォームに応じたアイコンを返す関数
  const getSocialIcon = (platform: string) => {
    const iconProps = { className: "h-5 w-5" };
    
    switch (platform.toLowerCase()) {
      case 'twitter':
      case 'x':
        return <Twitter {...iconProps} />;
      case 'instagram':
      case 'insta':
        return <Instagram {...iconProps} />;
      case 'facebook':
      case 'fb':
        return <Facebook {...iconProps} />;
      case 'youtube':
        return <Youtube {...iconProps} />;
      case 'line':
        return <FaLine className="h-5 w-5" />;
      default:
        return <ExternalLink {...iconProps} />;
    }
  };

  // プラットフォームに応じたボタンカラークラスを返す関数
  const getSocialButtonClass = (platform: string) => {
    switch (platform.toLowerCase()) {
      case 'twitter':
      case 'x':
        return 'bg-[#1DA1F2] hover:bg-[#1a94df] text-white';
      case 'instagram':
      case 'insta':
        return 'bg-gradient-to-r from-[#833AB4] via-[#FD1D1D] to-[#FCAF45] hover:opacity-90 text-white';
      case 'facebook':
      case 'fb':
        return 'bg-[#4267B2] hover:bg-[#375694] text-white';
      case 'youtube':
        return 'bg-[#FF0000] hover:bg-[#e50000] text-white';
      case 'line':
        return 'bg-[#06C755] hover:bg-[#05b64d] text-white';
      default:
        return 'bg-gray-100 hover:bg-gray-200 text-gray-800';
    }
  };

  return (
    <div className={`${className}`} style={{ color: textColor }}>
      {/* 公式SNSリンク一覧 */}
      {links && links.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mb-4">
          {links.map((link, index) => (
            <a 
              key={index}
              href={link.url}
              target="_blank"
              rel="noopener noreferrer"
              className={`flex items-center justify-center p-2 rounded-md text-sm font-medium ${getSocialButtonClass(link.platform)}`}
            >
              {getSocialIcon(link.platform)}
              <span className="ml-2">{link.text || link.platform}</span>
            </a>
          ))}
        </div>
      )}

      {/* SCAI公式LINE追加 */}
      {(snsId || snsUrl) && (
        <div className="border rounded-md p-3 bg-white/70">
          <div className="flex items-center mb-2">
            <FaLine className="h-5 w-5 text-[#06C755] mr-2" />
            <h4 className="font-medium">公式LINE</h4>
          </div>
          
          {snsText && (
            <p className="text-sm mb-3">{snsText}</p>
          )}
          
          <div className="flex flex-wrap gap-2">
            {snsId && (
              <div className="flex items-center text-sm bg-gray-100 px-3 py-2 rounded-lg">
                <span className="font-bold mr-2">ID:</span>
                <span>{snsId}</span>
              </div>
            )}
            
            {snsUrl && (
              <a
                href={snsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center p-2 rounded-md bg-[#06C755] hover:bg-[#05b64d] text-white text-sm font-medium"
              >
                <FaLine className="h-4 w-4 mr-1" />
                <span>友だち追加</span>
              </a>
            )}
          </div>
        </div>
      )}
    </div>
  );
}