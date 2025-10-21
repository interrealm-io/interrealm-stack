export interface AuthProvider {
  authenticate(credentials: any): Promise<any>;
  validate(token: any): Promise<any>;
  revoke?(token: any): Promise<void>;
}
