export type AccountType = 'bank' | 'cash' | 'ewallet';

export interface Account {
  id: string;
  name: string;
  type: AccountType;
}
