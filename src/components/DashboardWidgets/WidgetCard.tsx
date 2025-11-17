// Reusable Widget Card Wrapper
// Provides consistent styling and features for all dashboard widgets
import { ReactNode, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { RefreshCw, Maximize2, Minimize2 } from 'lucide-react';

interface WidgetCardProps {
  title: string;
  icon: ReactNode;
  iconColor?: string;
  children: ReactNode;
  onRefresh?: () => void;
  badge?: string;
  badgeVariant?: 'default' | 'secondary' | 'outline' | 'destructive';
}

export function WidgetCard({
  title,
  icon,
  iconColor = 'text-blue-600',
  children,
  onRefresh,
  badge,
  badgeVariant = 'secondary',
}: WidgetCardProps) {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  const handleRefresh = async () => {
    if (onRefresh) {
      setIsRefreshing(true);
      try {
        await onRefresh();
      } finally {
        setTimeout(() => setIsRefreshing(false), 500);
      }
    }
  };

  return (
    <Card className={`h-full transition-all ${isExpanded ? 'col-span-2 row-span-2' : ''}`}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <span className={iconColor}>{icon}</span>
            <span>{title}</span>
            {badge && (
              <Badge variant={badgeVariant} className="ml-2">
                {badge}
              </Badge>
            )}
          </CardTitle>
          <div className="flex items-center gap-1">
            {onRefresh && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleRefresh}
                disabled={isRefreshing}
                className="h-8 w-8 p-0"
              >
                <RefreshCw
                  size={14}
                  className={isRefreshing ? 'animate-spin' : ''}
                />
              </Button>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsExpanded(!isExpanded)}
              className="h-8 w-8 p-0"
            >
              {isExpanded ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className={isExpanded ? 'max-h-[600px] overflow-y-auto' : ''}>
        {children}
      </CardContent>
    </Card>
  );
}
