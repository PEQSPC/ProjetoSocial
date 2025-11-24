export class AppUser {
  constructor(
    public readonly id: string,
    private _name: string,
    private _email: string,
    private _role: string,
    private _passwordHash: string | null,
    private _isActive: boolean,
    public readonly createdAt: Date,
    private _lastLoginAt: Date | null
  ) {}

  // Getters
  get name(): string {
    return this._name;
  }

  get email(): string {
    return this._email;
  }

  get role(): string {
    return this._role;
  }

  get passwordHash(): string | null {
    return this._passwordHash;
  }

  get isActive(): boolean {
    return this._isActive;
  }

  get lastLoginAt(): Date | null {
    return this._lastLoginAt;
  }

  // Methods
  toJSON() {
    return {
      id: this.id,
      name: this._name,
      email: this._email,
      role: this._role,
      isActive: this._isActive,
      createdAt: this.createdAt,
      lastLoginAt: this._lastLoginAt,
      // Never expose passwordHash
    };
  }
}