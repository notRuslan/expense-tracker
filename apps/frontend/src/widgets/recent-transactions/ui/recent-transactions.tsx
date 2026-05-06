'use client';

import type { Transaction } from '@expense-tracker/shared';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/shared/ui/card';
import { cn } from '@/shared/lib/utils';
import { useRecentTransactions } from '../model/use-recent-transactions';
import { Pagination } from './pagination';

interface RecentTransactionsProps {
  refreshKey?: number;
}

export function RecentTransactions({ refreshKey = 0 }: RecentTransactionsProps = {}) {
  const { data, page, setPage, totalPages, isLoading, error } =
    useRecentTransactions(refreshKey);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Последние транзакции</CardTitle>
        <CardDescription>
          {data ? `Всего записей: ${data.total}` : 'Загрузка…'}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {error && <p className="text-sm text-destructive">{error}</p>}

        {!error && data && data.items.length === 0 && (
          <p className="text-sm text-muted-foreground">Транзакций пока нет.</p>
        )}

        {!error && data && data.items.length > 0 && (
          <ul className="divide-y">
            {data.items.map((tx) => (
              <TransactionRow key={tx.id} tx={tx} />
            ))}
          </ul>
        )}

        <Pagination
          page={page}
          totalPages={totalPages}
          onChange={setPage}
          disabled={isLoading}
        />
      </CardContent>
    </Card>
  );
}

function TransactionRow({ tx }: { tx: Transaction }) {
  const sign = tx.type === 'income' ? '+' : '−';
  const amountClass = tx.type === 'income' ? 'text-emerald-600' : 'text-rose-600';
  const dateLabel = new Date(tx.date).toLocaleDateString('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });

  return (
    <li className="flex items-center justify-between py-3">
      <div className="min-w-0">
        <p className="truncate text-sm font-medium">
          {tx.description ?? 'Без описания'}
        </p>
        <p className="text-xs text-muted-foreground">{dateLabel}</p>
      </div>
      <span className={cn('text-sm font-semibold tabular-nums', amountClass)}>
        {sign}
        {tx.amount.toFixed(2)}
      </span>
    </li>
  );
}
