export interface Expense {
  id: string;
  amount: number;
  description: string | null;
  date: string;
  categoryId: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateExpenseDto {
  amount: number;
  description?: string;
  date: string;
  categoryId?: string;
}

export interface UpdateExpenseDto {
  amount?: number;
  description?: string;
  date?: string;
  categoryId?: string;
}
