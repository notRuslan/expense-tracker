export type TransactionType = 'income' | 'expense';

export interface Transaction {
  id: string;
  amount: number;
  type: TransactionType;
  description: string | null;
  date: string;
  categoryId: string | null;
  userId: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateTransactionDto {
  amount: number;
  type: TransactionType;
  description?: string;
  date: string;
  categoryId?: string;
}

export type UpdateTransactionDto = Partial<CreateTransactionDto>;

export interface TransactionsSummary {
  totalIncome: number;
  totalExpense: number;
  balance: number;
}

export interface TransactionsListResponse {
  items: Transaction[];
  summary: TransactionsSummary;
  total: number;
  page: number;
  limit: number;
}

export interface GetTransactionsFilter {
  month?: number;
  year?: number;
  page?: number;
  limit?: number;
}
