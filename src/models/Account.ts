export type AccountType = 'bank' | 'cash' | 'ewallet';

export interface Account {
  id: string;
  name: string;
  type: AccountType;
  icon?: string;
  /** Hidden from lists and pickers; history stays intact. */
  archived?: boolean;
}
