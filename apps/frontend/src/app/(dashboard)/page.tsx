'use client';

import { useState } from 'react';
import { Button } from '@/shared/ui/button';
import { CreateTransactionForm } from '@/features/create-transaction';
import { RecentTransactions } from '@/widgets/recent-transactions';

export default function DashboardPage() {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Главная</h1>
        {!isFormOpen && (
          <Button onClick={() => setIsFormOpen(true)}>+ Новая транзакция</Button>
        )}
      </div>

      {isFormOpen && (
        <CreateTransactionForm
          onCreated={() => {
            setRefreshKey((v) => v + 1);
            setIsFormOpen(false);
          }}
          onCancel={() => setIsFormOpen(false)}
        />
      )}

      <RecentTransactions refreshKey={refreshKey} />
    </div>
  );
}
