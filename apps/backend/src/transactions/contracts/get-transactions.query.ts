export class GetTransactionsQuery {
  constructor(
    public readonly userId: string,
    public readonly month?: number,
    public readonly year?: number,
  ) {}
}
