'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import Link from 'next/link';
import { Button } from '@/shared/ui/button';
import { Input } from '@/shared/ui/input';
import {
  Card,
  CardContent,
  CardDescription,
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
import { useRegister } from '../model/use-register';

const registerSchema = z.object({
  name: z.string().min(2, 'Имя должно содержать минимум 2 символа'),
  email: z.string().email('Введите корректный email'),
  password: z.string().min(8, 'Пароль должен содержать минимум 8 символов'),
  acceptTerms: z.boolean().refine((val) => val === true, {
    message: 'Необходимо принять условия соглашения',
  }),
});

type RegisterFormValues = z.infer<typeof registerSchema>;

export function RegisterForm() {
  const { register, isLoading, error } = useRegister();

  const form = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: { name: '', email: '', password: '', acceptTerms: false },
  });

  const onSubmit = ({ acceptTerms: _, ...dto }: RegisterFormValues) => {
    register(dto);
  };

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>Регистрация</CardTitle>
        <CardDescription>Создайте новый аккаунт</CardDescription>
      </CardHeader>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <CardContent className="space-y-4">
            {error && <p className="text-sm text-destructive">{error}</p>}
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Имя</FormLabel>
                  <FormControl>
                    <Input placeholder="Иван Иванов" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input type="email" placeholder="you@example.com" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Пароль</FormLabel>
                  <FormControl>
                    <Input type="password" placeholder="••••••••" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="acceptTerms"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-2 space-y-0">
                  <input
                    type="checkbox"
                    id="acceptTerms"
                    checked={field.value}
                    onChange={field.onChange}
                    onBlur={field.onBlur}
                    className="h-4 w-4 shrink-0 rounded border border-input accent-primary cursor-pointer"
                  />
                  <div className="space-y-1 leading-none">
                    <label
                      htmlFor="acceptTerms"
                      className="text-sm cursor-pointer select-none"
                    >
                      Согласен с{' '}
                      <Link
                        href="/terms"
                        className="text-primary underline-offset-4 hover:underline"
                      >
                        пользовательским соглашением
                      </Link>
                      {' '}и{' '}
                      <Link
                        href="/privacy"
                        className="text-primary underline-offset-4 hover:underline"
                      >
                        политикой обработки данных
                      </Link>
                    </label>
                    <FormMessage />
                  </div>
                </FormItem>
              )}
            />
          </CardContent>
          <CardFooter className="flex flex-col gap-4">
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? 'Регистрация...' : 'Создать аккаунт'}
            </Button>
            <p className="text-sm text-muted-foreground text-center">
              Уже есть аккаунт?{' '}
              <Link href="/login" className="text-primary underline-offset-4 hover:underline">
                Войти
              </Link>
            </p>
          </CardFooter>
        </form>
      </Form>
    </Card>
  );
}
