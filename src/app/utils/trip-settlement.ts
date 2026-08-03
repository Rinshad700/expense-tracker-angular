export interface ExpenseShare {
  participantName: string;
  amount: number;
}

export interface SettlementEntry {
  from: string;
  to: string;
  amount: number;
}

export interface TripParticipant {
  name: string;
}

export interface TripExpenseSplit {
  participantName: string;
  amount: number;
}

export interface TripExpenseRecord {
  id: number;
  tripId: number;
  title: string;
  category: string;
  amount: number;
  date: string;
  notes?: string;
  paidBy?: string;
  currency?: string;
  participants?: TripParticipant[];
  splits?: TripExpenseSplit[];
  splitType?: 'equal' | 'custom';
}

export interface CustomSplitValidationResult {
  isValid: boolean;
  difference: number;
  type: 'match' | 'exceeds' | 'short';
}

export function calculateExpenseShares(amount: number, participants: string[], splitType: 'equal' | 'custom' = 'equal'): ExpenseShare[] {
  if (participants.length === 0 || amount <= 0) {
    return [];
  }

  if (splitType === 'custom') {
    return participants.map((participantName) => ({
      participantName,
      amount: 0
    }));
  }

  const share = amount / participants.length;
  return participants.map((participantName) => ({
    participantName,
    amount: Number(share.toFixed(2))
  }));
}

export function validateCustomSplit(totalAmount: number, expenseAmount: number): CustomSplitValidationResult {
  const difference = Number((totalAmount - expenseAmount).toFixed(2));

  if (Math.abs(difference) < 0.01) {
    return { isValid: true, difference: 0, type: 'match' };
  }

  return {
    isValid: false,
    difference,
    type: difference > 0 ? 'exceeds' : 'short'
  };
}

export function calculateSettlements(balances: { participantName: string; amount: number }[]): SettlementEntry[] {
  const creditors = balances
    .filter((balance) => balance.amount > 0)
    .sort((a, b) => b.amount - a.amount)
    .map((balance) => ({ ...balance }));

  const debtors = balances
    .filter((balance) => balance.amount < 0)
    .sort((a, b) => a.amount - b.amount)
    .map((balance) => ({ participantName: balance.participantName, amount: Math.abs(balance.amount) }));

  const settlements: SettlementEntry[] = [];

  let creditorIndex = 0;
  let debtorIndex = 0;

  while (creditorIndex < creditors.length && debtorIndex < debtors.length) {
    const creditor = creditors[creditorIndex];
    const debtor = debtors[debtorIndex];
    const transferAmount = Math.min(creditor.amount, debtor.amount);

    if (transferAmount > 0) {
      settlements.push({
        from: debtor.participantName,
        to: creditor.participantName,
        amount: Number(transferAmount.toFixed(2))
      });
      creditor.amount -= transferAmount;
      debtor.amount -= transferAmount;
    }

    if (creditor.amount <= 0.01) {
      creditorIndex += 1;
    }

    if (debtor.amount <= 0.01) {
      debtorIndex += 1;
    }
  }

  return settlements;
}
