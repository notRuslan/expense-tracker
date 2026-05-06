'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { isAuthenticated } from '@/entities/session';
import { DashboardSidebar } from '@/widgets/dashboard-sidebar';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    if (!isAuthenticated()) {
      router.replace('/login');
      return;
    }
    setChecked(true);
  }, [router]);

  if (!checked) return null;

  return (
    <div className="flex min-h-screen">
      <DashboardSidebar />
      <main className="flex-1 overflow-auto p-8">{children}</main>
    </div>
  );
}
