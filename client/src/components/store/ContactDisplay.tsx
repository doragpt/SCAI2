import { Button } from "@/components/ui/button";
import { User, Phone, Mail, Globe } from "lucide-react";

interface ContactDisplayProps {
  recruiterName?: string;
  phoneNumbers?: string[];
  emailAddresses?: string[];
  pcWebsiteUrl?: string;
  mobileWebsiteUrl?: string;
  className?: string;
}

/**
 * 店舗の連絡先情報表示コンポーネント
 */
export function ContactDisplay({
  recruiterName,
  phoneNumbers,
  emailAddresses,
  pcWebsiteUrl,
  mobileWebsiteUrl,
  className = "",
}: ContactDisplayProps) {
  const hasContactInfo = 
    !!recruiterName || 
    (phoneNumbers && phoneNumbers.length > 0) || 
    (emailAddresses && emailAddresses.length > 0) ||
    !!pcWebsiteUrl ||
    !!mobileWebsiteUrl;
    
  if (!hasContactInfo) {
    return null;
  }
  
  return (
    <div className={`space-y-6 ${className}`}>
      <h4 className="font-medium text-gray-700 dark:text-gray-300 mb-3 flex items-center">
        <User className="h-4 w-4 mr-2 text-gray-500" />
        連絡先情報
      </h4>
      
      <div className="rounded-lg border border-gray-200 dark:border-gray-800 overflow-hidden">
        {/* 採用担当者 */}
        {recruiterName && (
          <div className="p-4 bg-gray-50 dark:bg-gray-900">
            <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">採用担当者</div>
            <div className="flex items-center gap-2">
              <User className="h-4 w-4 text-blue-500" />
              <span className="text-gray-900 dark:text-gray-100">{recruiterName}</span>
            </div>
          </div>
        )}
        
        {/* 電話番号 */}
        {phoneNumbers && phoneNumbers.length > 0 && (
          <div className="p-4 border-t border-gray-200 dark:border-gray-800">
            <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">電話番号</div>
            <div className="space-y-2">
              {phoneNumbers.map((phone, index) => (
                <div key={index} className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-green-500" />
                  <Button
                    variant="link"
                    className="px-0 h-auto text-gray-900 dark:text-gray-100"
                    asChild
                  >
                    <a href={`tel:${phone.replace(/[-\s]/g, '')}`}>
                      {phone}
                    </a>
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}
        
        {/* メールアドレス */}
        {emailAddresses && emailAddresses.length > 0 && (
          <div className="p-4 border-t border-gray-200 dark:border-gray-800">
            <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">メールアドレス</div>
            <div className="space-y-2">
              {emailAddresses.map((email, index) => (
                <div key={index} className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-purple-500" />
                  <Button
                    variant="link"
                    className="px-0 h-auto text-gray-900 dark:text-gray-100"
                    asChild
                  >
                    <a href={`mailto:${email}`}>
                      {email}
                    </a>
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}
        
        {/* Webサイト */}
        {(pcWebsiteUrl || mobileWebsiteUrl) && (
          <div className="p-4 border-t border-gray-200 dark:border-gray-800">
            <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Webサイト</div>
            <div className="space-y-2">
              {pcWebsiteUrl && (
                <div className="flex items-center gap-2">
                  <Globe className="h-4 w-4 text-orange-500" />
                  <Button
                    variant="link"
                    className="px-0 h-auto text-gray-900 dark:text-gray-100"
                    asChild
                  >
                    <a href={pcWebsiteUrl} target="_blank" rel="noopener noreferrer">
                      公式サイト
                    </a>
                  </Button>
                </div>
              )}
              
              {mobileWebsiteUrl && (
                <div className="flex items-center gap-2">
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-pink-500">
                    <rect x="5" y="2" width="14" height="20" rx="2" ry="2" />
                    <line x1="12" y1="18" x2="12.01" y2="18" />
                  </svg>
                  <Button
                    variant="link"
                    className="px-0 h-auto text-gray-900 dark:text-gray-100"
                    asChild
                  >
                    <a href={mobileWebsiteUrl} target="_blank" rel="noopener noreferrer">
                      モバイルサイト
                    </a>
                  </Button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}