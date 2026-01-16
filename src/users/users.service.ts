import { Injectable } from '@nestjs/common';
import { User } from './user.interface';
import { randomUUID } from 'crypto';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UsersService {
  private users: User[] = [];

  async createLocal(username: string, password: string, email?: string) {
    const passwordHash = await bcrypt.hash(password, 10);
    const user: User = { id: randomUUID(), username, passwordHash, email };
    this.users.push(user);
    return { ...user, passwordHash: undefined } as Partial<User>;
  }

  async findByUsername(username: string) {
    return this.users.find((u) => u.username === username);
  }

  async findById(id: string) {
    return this.users.find((u) => u.id === id);
  }

  async validatePassword(user: User, password: string) {
    if (!user || !user.passwordHash) return false;
    return bcrypt.compare(password, user.passwordHash);
  }

  async findOrCreateFromOAuth(
    provider: string,
    providerId: string,
    profile: any,
  ) {
    let user = this.users.find(
      (u) => u.provider === provider && u.providerId === providerId,
    );
    if (!user) {
      user = {
        id: randomUUID(),
        provider,
        providerId,
        username:
          profile.username ||
          profile.login ||
          profile.email ||
          `${provider}_${providerId}`,
        email: profile.email,
      };
      this.users.push(user);
    }
    return user;
  }
}
