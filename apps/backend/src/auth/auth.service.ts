import { Injectable, UnauthorizedException } from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import type { AuthResponse, PublicUser } from '@expense-tracker/shared';
import { CreateUserCommand } from '../users/contracts';
import { GetUserByEmailQuery, GetUserByEmailResult } from '../users/contracts';
import type { RegisterDtoImpl } from './dto/register.dto';
import type { LoginDtoImpl } from './dto/login.dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
    private readonly jwtService: JwtService,
  ) {}

  async register(dto: RegisterDtoImpl): Promise<AuthResponse> {
    const passwordHash = await bcrypt.hash(dto.password, 10);
    const user = await this.commandBus.execute<CreateUserCommand, PublicUser>(
      new CreateUserCommand(dto.email, dto.name, passwordHash),
    );
    const token = this.jwtService.sign({ sub: user.id, email: user.email });
    return { token, user };
  }

  async login(dto: LoginDtoImpl): Promise<AuthResponse> {
    const found = await this.queryBus.execute<GetUserByEmailQuery, GetUserByEmailResult | null>(
      new GetUserByEmailQuery(dto.email),
    );

    const invalid = !found || !(await bcrypt.compare(dto.password, found.passwordHash));
    if (invalid) {
      throw new UnauthorizedException('Неверный email или пароль');
    }

    const user: PublicUser = {
      id: found.id,
      email: found.email,
      name: found.name,
      createdAt: found.createdAt.toISOString(),
      updatedAt: found.updatedAt.toISOString(),
    };
    const token = this.jwtService.sign({ sub: user.id, email: user.email });
    return { token, user };
  }
}
