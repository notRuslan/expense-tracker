import type { PublicUser } from '@expense-tracker/shared';

export class CreateUserCommand {
  constructor(
    public readonly email: string,
    public readonly name: string,
    public readonly passwordHash: string,
  ) {}
}

export type CreateUserResult = PublicUser;
