export class GetUserByIdQuery {
  constructor(public readonly id: string) {}
}

export interface GetUserByIdResult {
  id: string;
  email: string;
  name: string;
  createdAt: Date;
  updatedAt: Date;
}
