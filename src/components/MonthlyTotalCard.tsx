import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface MonthlyTotalCardProps {
  total: number;
  month?: string;
}

export function MonthlyTotalCard({ total, month }: MonthlyTotalCardProps) {
  const currentDate = new Date();
  const displayMonth = month || currentDate.toLocaleString('en-US', { month: 'long', year: 'numeric' });

  const formatCurrency = (amount: number): string => {
    return `₱${amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  return (
    <Card className="mb-6 bg-linear-to-r from-blue-50 to-indigo-50 border-blue-200">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium text-gray-600">Monthly Total</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-baseline justify-between">
          <div>
            <p className="text-3xl font-bold text-blue-600">{formatCurrency(total)}</p>
            <p className="text-xs text-gray-500 mt-1">{displayMonth}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
