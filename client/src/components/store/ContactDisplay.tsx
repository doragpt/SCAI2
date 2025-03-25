import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { 
  Phone, Mail, Globe, User, Link as LinkIcon, 
  MessageCircle, ExternalLink, Heart
} from "lucide-react";
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
    <Card className={`border-0 shadow-md overflow-hidden ${className}`}>
      <CardHeader className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white">
        <h3 className="text-xl font-bold flex items-center">
          <MessageCircle className="mr-2 h-5 w-5 text-blue-100" />
          連絡先情報
        </h3>
      </CardHeader>
      
      <CardContent className="p-5 space-y-8">
        {/* コンタクトバナー */}
        <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-100 dark:border-blue-800/30 mb-4">
          <div className="flex items-center justify-center mb-2">
            <span className="inline-flex items-center px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium">
              <Heart className="h-3 w-3 mr-1" />
              SCAI（スカイ）採用特典あり
            </span>
          </div>
          <p className="text-center text-sm text-blue-700 dark:text-blue-300">
            下記の連絡先に「SCAI（スカイ）を見た」とお伝えいただくとスムーズです
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {/* 採用担当者 */}
          {recruiterName && (
            <div className="bg-gray-50 dark:bg-gray-900/50 p-4 rounded-lg border border-gray-100 dark:border-gray-800 flex items-start">
              <div className="mr-3 bg-white dark:bg-gray-800 p-2 rounded-full">
                <User className="h-6 w-6 text-gray-600 dark:text-gray-300" />
              </div>
              <div>
                <div className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">採用担当</div>
                <div className="text-lg font-bold text-gray-800 dark:text-gray-200">{recruiterName}</div>
              </div>
            </div>
          )}
          
          {/* 電話番号 */}
          {phoneNumbers && phoneNumbers.length > 0 && (
            <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-100 dark:border-blue-800/30 flex items-start md:col-span-2">
              <div className="mr-3 bg-blue-500 p-2 rounded-full">
                <Phone className="h-6 w-6 text-white" />
              </div>
              <div className="flex-1">
                <div className="text-sm font-medium text-blue-700 dark:text-blue-300 mb-3">電話でのお問い合わせ</div>
                <div className="space-y-2">
                  {phoneNumbers.map((phone, index) => (
                    <Button 
                      key={index} 
                      size="lg" 
                      className="w-full justify-center font-bold text-lg bg-blue-600 hover:bg-blue-700"
                      asChild
                    >
                      <a href={`tel:${phone.replace(/[^0-9]/g, '')}`}>
                        <Phone className="h-5 w-5 mr-2" />
                        {phone}
                      </a>
                    </Button>
                  ))}
                </div>
              </div>
            </div>
          )}
          
          {/* メールアドレス */}
          {emailAddresses && emailAddresses.length > 0 && (
            <div className={`bg-green-50 dark:bg-green-900/20 p-4 rounded-lg border border-green-100 dark:border-green-800/30 flex items-start ${phoneNumbers && phoneNumbers.length > 0 ? '' : 'md:col-span-2'}`}>
              <div className="mr-3 bg-green-500 p-2 rounded-full">
                <Mail className="h-6 w-6 text-white" />
              </div>
              <div className="flex-1">
                <div className="text-sm font-medium text-green-700 dark:text-green-300 mb-3">メールでのお問い合わせ</div>
                <div className="space-y-2">
                  {emailAddresses.map((email, index) => (
                    <Button
                      key={index}
                      variant="outline"
                      size="sm"
                      className="w-full justify-start font-medium break-all border-green-200 dark:border-green-800 text-green-700 dark:text-green-300 hover:bg-green-100 dark:hover:bg-green-900/30"
                      asChild
                    >
                      <a href={`mailto:${email}`}>
                        <Mail className="h-4 w-4 mr-2 text-green-500" />
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
            <div className={`bg-purple-50 dark:bg-purple-900/20 p-4 rounded-lg border border-purple-100 dark:border-purple-800/30 flex items-start ${emailAddresses && emailAddresses.length > 0 && phoneNumbers && phoneNumbers.length > 0 ? '' : 'md:col-span-2'}`}>
              <div className="mr-3 bg-purple-500 p-2 rounded-full">
                <Globe className="h-6 w-6 text-white" />
              </div>
              <div className="flex-1">
                <div className="text-sm font-medium text-purple-700 dark:text-purple-300 mb-3">公式サイト</div>
                <div className="space-y-2">
                  {pcWebsiteUrl && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full justify-start font-medium border-purple-200 dark:border-purple-800 text-purple-700 dark:text-purple-300 hover:bg-purple-100 dark:hover:bg-purple-900/30"
                      asChild
                    >
                      <a href={pcWebsiteUrl} target="_blank" rel="noopener noreferrer">
                        <ExternalLink className="h-4 w-4 mr-2 text-purple-500" />
                        公式サイトを見る
                      </a>
                    </Button>
                  )}
                  
                  {mobileWebsiteUrl && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full justify-start font-medium border-purple-200 dark:border-purple-800 text-purple-700 dark:text-purple-300 hover:bg-purple-100 dark:hover:bg-purple-900/30"
                      asChild
                    >
                      <a href={mobileWebsiteUrl} target="_blank" rel="noopener noreferrer">
                        <ExternalLink className="h-4 w-4 mr-2 text-purple-500" />
                        モバイルサイトを見る
                      </a>
                    </Button>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
        
        {/* SCAI（スカイ）ブランディング */}
        <div className="flex items-center justify-center py-2">
          <div className="inline-flex items-center text-xs text-gray-500 dark:text-gray-400">
            <Heart className="h-3 w-3 mr-1 text-blue-500" />
            <span>SCAI（スカイ）でマッチング</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}