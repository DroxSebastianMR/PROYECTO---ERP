export enum UserRole {
  ADMIN = "ADMIN",
  MANAGER = "MANAGER",
  SALES_PURCHASING = "SALES_PURCHASING",
  ACCOUNTANT = "ACCOUNTANT",
  WAREHOUSE = "WAREHOUSE",
}

export enum AuthStorage {
  PERSISTENT = "persistent",
  SESSION = "session",
}

export type AuthenticatedUser = {
  id: string;
  companyId: string;
  email: string;
  fullName: string;
  role: UserRole;
  permissions: string[];
};

export type AuthTokens = {
  accessToken: string;
  refreshToken: string;
  expiresIn: string;
};

export type AuthApiResponse = {
  user: AuthenticatedUser;
  tokens: AuthTokens;
};

export type LoginCredentials = {
  email: string;
  password: string;
};

export type LoginResponse = AuthApiResponse;
export type RefreshResponse = AuthApiResponse;

export type StoredAuthSession = {
  user: AuthenticatedUser;
  refreshToken: string;
  /** Short-lived token used only to restore an already authenticated tab quickly. */
  accessToken?: string;
};
