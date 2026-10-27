export interface Transfer {
  id: string;
  fromAccount: string;
  toAccount: string;
  amount: number;
  timestamp: string;
  createdAt?: string;
}
