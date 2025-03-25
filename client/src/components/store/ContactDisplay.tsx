import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Phone, Mail, Globe, User, Link as LinkIcon } from "lucide-react";
import { Button } from "@/components/ui/button";

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
    <Card className={className}>
      <CardHeader className="pb-3">
        <h3 className="text-xl font-semibold flex items-center">
          <Phone className="mr-2 h-5 w-5 text-primary" />
          連絡先情報
        </h3>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* 採用担当者 */}
        {recruiterName && (
          <div className="flex items-start gap-3">
            <User className="h-5 w-5 text-gray-500 mt-0.5" />
            <div>
              <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">採用担当</div>
              <div className="font-medium">{recruiterName}</div>
            </div>
          </div>
        )}
        
        {/* 電話番号 */}
        {phoneNumbers && phoneNumbers.length > 0 && (
          <div className="flex items-start gap-3">
            <Phone className="h-5 w-5 text-blue-500 mt-0.5" />
            <div>
              <div className="text-sm text-gray-600 dark:text-gray-400 mb-2">電話番号</div>
              <div className="space-y-2">
                {phoneNumbers.map((phone, index) => (
                  <Button 
                    key={index} 
                    variant="outline" 
                    size="sm" 
                    className="w-full justify-start font-medium"
                    asChild
                  >
                    <a href={`tel:${phone.replace(/[^0-9]/g, '')}`}>
                      {phone}
                    </a>
                  </Button>
                ))}
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                ※ 「ScoutAI（スカウトアイ）を見た」とお伝えいただくとスムーズです
              </div>
            </div>
          </div>
        )}
        
        {/* メールアドレス */}
        {emailAddresses && emailAddresses.length > 0 && (
          <div className="flex items-start gap-3">
            <Mail className="h-5 w-5 text-green-500 mt-0.5" />
            <div>
              <div className="text-sm text-gray-600 dark:text-gray-400 mb-2">メールアドレス</div>
              <div className="space-y-2">
                {emailAddresses.map((email, index) => (
                  <Button
                    key={index}
                    variant="outline"
                    size="sm"
                    className="w-full justify-start font-medium break-all"
                    asChild
                  >
                    <a href={`mailto:${email}`}>
                      {email}
                    </a>
                  </Button>
                ))}
              </div>
            </div>
          </div>
        )}
        
        {/* ウェブサイト */}
        {(pcWebsiteUrl || mobileWebsiteUrl) && (
          <div className="flex items-start gap-3">
            <Globe className="h-5 w-5 text-purple-500 mt-0.5" />
            <div>
              <div className="text-sm text-gray-600 dark:text-gray-400 mb-2">ウェブサイト</div>
              <div className="space-y-2">
                {pcWebsiteUrl && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full justify-start font-medium"
                    asChild
                  >
                    <a href={pcWebsiteUrl} target="_blank" rel="noopener noreferrer">
                      <LinkIcon className="h-4 w-4 mr-2" />
                      公式サイト
                    </a>
                  </Button>
                )}
                
                {mobileWebsiteUrl && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full justify-start font-medium"
                    asChild
                  >
                    <a href={mobileWebsiteUrl} target="_blank" rel="noopener noreferrer">
                      <LinkIcon className="h-4 w-4 mr-2" />
                      モバイルサイト
                    </a>
                  </Button>
                )}
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}