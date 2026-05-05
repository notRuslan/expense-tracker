export class GetUserByEmailQuery {
  constructor(public readonly email: string) {}
}

export interface GetUserByEmailResult {
  id: string;
  email: string;
  name: string;
  passwordHash: string;
  createdAt: Date;
  updatedAt: Date;
}
