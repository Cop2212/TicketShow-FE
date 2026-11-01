export interface ApiResponse<T = unknown> {
  success: boolean;
  message: string;
  data?: T;
  errors?: string[];
}

export enum UserRole {
  Admin = 1,
  Organizer = 2,
  Staff = 3,
  Customer = 4,
  VenueOwner = 5
}

export interface CurrentUser {
  userId: string;
  email: string;
  fullName: string;
  role: UserRole;
}

export interface AuthResult {
  userId: string;
  email: string;
  fullName: string;
  role: UserRole;
  accessToken: string;
  refreshToken: string;
  expiresAt: string;
}
