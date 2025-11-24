
export interface ITokenBlacklistService {
  addToken(token: string): void;
  isBlacklisted(token: string): boolean;
  removeToken(token: string): void;
  clear(): void;
  size(): number;
}