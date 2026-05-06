export class GetTransactionsQuery {
  constructor(
    public readonly userId: string,
    public readonly month?: number,
    public readonly year?: number,
    public readonly page?: number,
    public readonly limit?: number,
  ) {}
}
