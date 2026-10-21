import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface MonthlyTotalCardProps {
  total: number;
  month?: string;
  title?: string;
  subtitle?: string;
  period?: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly';
  onPeriodChange?: (value: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly') => void;
}

export function MonthlyTotalCard({ total, month, title, subtitle, period, onPeriodChange }: MonthlyTotalCardProps) {
  const currentDate = new Date();
  const displayMonth = month || currentDate.toLocaleString('en-US', { month: 'long', year: 'numeric' });
  const displaySubtitle = subtitle || displayMonth;
  const displayTitle = title || 'Monthly Total';

  const formatCurrency = (amount: number): string => {
    return `₱${amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  return (
    <Card className="mb-6 bg-linear-to-r from-blue-50 to-indigo-50 border-blue-200">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between gap-3">
          <CardTitle className="text-sm font-medium text-gray-600">{displayTitle}</CardTitle>
          {period && onPeriodChange && (
            <Select value={period} onValueChange={(v: any) => onPeriodChange(v)}>
              <SelectTrigger className="h-7 w-32 text-xs bg-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="daily">Daily</SelectItem>
                <SelectItem value="weekly">Weekly</SelectItem>
                <SelectItem value="monthly">Monthly</SelectItem>
                <SelectItem value="quarterly">Quarterly</SelectItem>
                <SelectItem value="yearly">Yearly</SelectItem>
              </SelectContent>
            </Select>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex items-baseline justify-between">
          <div>
            <p className="text-3xl font-bold text-blue-600">{formatCurrency(total)}</p>
            <p className="text-xs text-gray-500 mt-1">{displaySubtitle}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
