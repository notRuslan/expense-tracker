'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import type { Transaction } from '@expense-tracker/shared';
import { Button } from '@/shared/ui/button';
import { Input } from '@/shared/ui/input';
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/shared/ui/card';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/shared/ui/form';
import { useCreateTransaction } from '../model/use-create-transaction';

const TYPES = ['expense', 'income'] as const;

const schema = z.object({
  amount: z.coerce.number().positive('Сумма должна быть положительной'),
  type: z.enum(TYPES),
  description: z.string().max(255).optional(),
  date: z.string().min(1, 'Укажите дату'),
});

type FormValues = z.infer<typeof schema>;

interface Props {
  onCreated?: (tx: Transaction) => void;
  onCancel?: () => void;
}

function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}

export function CreateTransactionForm({ onCreated, onCancel }: Props) {
  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      amount: 0,
      type: 'expense',
      description: '',
      date: todayISO(),
    },
  });

  const { submit, isLoading, error } = useCreateTransaction((tx) => {
    form.reset({ amount: 0, type: 'expense', description: '', date: todayISO() });
    onCreated?.(tx);
  });

  const onSubmit = (values: FormValues) => {
    submit({
      amount: values.amount,
      type: values.type,
      description: values.description?.trim() || undefined,
      date: new Date(values.date).toISOString(),
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Новая транзакция</CardTitle>
      </CardHeader>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <CardContent className="space-y-4">
            {error && <p className="text-sm text-destructive">{error}</p>}

            <FormField
              control={form.control}
              name="type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Тип</FormLabel>
                  <FormControl>
                    <select
                      {...field}
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    >
                      <option value="expense">Расход</option>
                      <option value="income">Доход</option>
                    </select>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="amount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Сумма</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      placeholder="0.00"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="date"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Дата</FormLabel>
                  <FormControl>
                    <Input type="date" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Описание</FormLabel>
                  <FormControl>
                    <Input placeholder="Например, продукты" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
          <CardFooter className="flex justify-end gap-2">
            {onCancel && (
              <Button
                type="button"
                variant="outline"
                onClick={onCancel}
                disabled={isLoading}
              >
                Отмена
              </Button>
            )}
            <Button type="submit" disabled={isLoading}>
              {isLoading ? 'Сохранение...' : 'Создать'}
            </Button>
          </CardFooter>
        </form>
      </Form>
    </Card>
  );
}
