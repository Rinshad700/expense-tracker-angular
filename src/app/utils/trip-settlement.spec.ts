import { describe, expect, it } from 'vitest';
import { calculateExpenseShares, calculateSettlements, validateCustomSplit } from './trip-settlement';

describe('trip settlement helpers', () => {
  it('splits an expense equally across participants', () => {
    const shares = calculateExpenseShares(3000, ['Alice', 'Bob', 'Carol'], 'equal');

    expect(shares).toEqual([
      { participantName: 'Alice', amount: 1000 },
      { participantName: 'Bob', amount: 1000 },
      { participantName: 'Carol', amount: 1000 }
    ]);
  });

  it('creates a settlement plan from balances', () => {
    const balances = [
      { participantName: 'Alice', amount: 1000 },
      { participantName: 'Bob', amount: -500 },
      { participantName: 'Carol', amount: -500 }
    ];

    const settlements = calculateSettlements(balances);

    expect(settlements).toEqual([
      { from: 'Alice', to: 'Bob', amount: 500 },
      { from: 'Alice', to: 'Carol', amount: 500 }
    ]);
  });

  it('reports when a custom split exceeds the expense amount', () => {
    expect(validateCustomSplit(6000, 5000)).toEqual({
      isValid: false,
      difference: 1000,
      type: 'exceeds'
    });
  });

  it('reports when a custom split is short of the expense amount', () => {
    expect(validateCustomSplit(4000, 5000)).toEqual({
      isValid: false,
      difference: -1000,
      type: 'short'
    });
  });
});
