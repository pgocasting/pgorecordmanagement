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
    <Card className="mb-6 bg-gradient-to-r from-blue-950/40 via-indigo-950/30 to-slate-900/60 border-blue-500/25 backdrop-blur-xl shadow-xl shadow-blue-950/30">
      <CardHeader className="pb-3 border-b border-white/[0.06]">
        <div className="flex items-center justify-between gap-3">
          <CardTitle className="text-xs font-semibold uppercase tracking-wider text-blue-300/80">{displayTitle}</CardTitle>
          {period && onPeriodChange && (
            <Select value={period} onValueChange={(v: any) => onPeriodChange(v)}>
              <SelectTrigger className="h-7 w-32 text-xs bg-white/[0.06] border-white/10 text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-slate-900 border-white/10 text-white">
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
      <CardContent className="pt-4">
        <div className="flex items-baseline justify-between">
          <div>
            <p className="text-3xl font-extrabold bg-gradient-to-r from-blue-400 to-indigo-300 bg-clip-text text-transparent">{formatCurrency(total)}</p>
            <p className="text-xs text-slate-400 mt-1">{displaySubtitle}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
