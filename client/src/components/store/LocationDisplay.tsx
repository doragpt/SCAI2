import { MapPinIcon } from "lucide-react";
import { type Prefecture } from "@shared/schema";

interface LocationDisplayProps {
  location: Prefecture;
  className?: string;
}

/**
 * 位置情報表示コンポーネント
 * 現在はシンプルに都道府県情報を表示するが、将来的に地図表示などに拡張可能
 */
export function LocationDisplay({
  location,
  className = ""
}: LocationDisplayProps) {
  if (!location) {
    return null;
  }
  
  return (
    <div className={`flex items-center ${className}`}>
      <MapPinIcon className="h-5 w-5 mr-2 text-rose-500" />
      <span className="text-lg font-medium">{location}</span>
    </div>
  );
}