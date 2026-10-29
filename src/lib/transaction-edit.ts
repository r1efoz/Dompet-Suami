import type { Transaction } from '../models/Transaction';
import { formatIDR } from './format';

export function buildTransferEdit({
  outId, inId, transferId, fromId, toId, amount, adminFee, timestamp, fromName, toName
}: {
  outId: string; inId: string; transferId: string; fromId: string; toId: string;
  amount: number; adminFee: number; timestamp: string; fromName: string; toName: string;
}): [Transaction, Transaction] {
  return [
    {
      id: outId, type: 'expense', amount: amount + adminFee,
      description: `Transfer ke ${toName}${adminFee > 0 ? ` (biaya ${formatIDR(adminFee)})` : ''}`,
      source: fromId, destination: toId, transferId, timestamp
    },
    {
      id: inId, type: 'income', amount, description: `Transfer dari ${fromName}`,
      source: toId, destination: fromId, transferId, timestamp
    }
  ];
}
