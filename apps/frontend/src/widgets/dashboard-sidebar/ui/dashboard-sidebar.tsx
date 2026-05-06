'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import type { PublicUser } from '@expense-tracker/shared';
import { clearSession, getUser } from '@/entities/session';
import { Button } from '@/shared/ui/button';
import { cn } from '@/shared/lib/utils';

const NAV_ITEMS = [
  { href: '/', label: 'Главная' },
  { href: '/transactions', label: 'Транзакции' },
  { href: '/categories', label: 'Категории' },
];

export function DashboardSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<PublicUser | null>(null);

  useEffect(() => {
    setUser(getUser());
  }, []);

  const handleLogout = () => {
    clearSession();
    router.push('/login');
  };

  return (
    <aside className="flex h-screen w-64 flex-col border-r bg-muted/30 p-4">
      <div className="border-b pb-4">
        <p className="text-sm font-semibold">{user?.name ?? '...'}</p>
        <p className="truncate text-xs text-muted-foreground">{user?.email ?? ''}</p>
      </div>

      <nav className="mt-4 flex flex-1 flex-col gap-1">
        {NAV_ITEMS.map((item) => {
          const active = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'rounded-md px-3 py-2 text-sm transition-colors',
                active
                  ? 'bg-primary text-primary-foreground'
                  : 'hover:bg-accent hover:text-accent-foreground',
              )}
            >
              {item.label}
            </Link>
          );
        })}
      </nav>

      <Button variant="outline" onClick={handleLogout}>
        Выйти
      </Button>
    </aside>
  );
}
