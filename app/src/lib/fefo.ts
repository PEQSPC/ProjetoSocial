export type StockLot = {
  id: string;
  itemId: string;
  code?: string | null;
  entryDate?: string | null;
  expiryDate?: string | null;
  remainingQty: number;
};

export type FefoPick = { lotId: string; qty: number };

function expiryRank(l: StockLot): number {
  return l.expiryDate
    ? new Date(l.expiryDate).getTime()
    : Number.POSITIVE_INFINITY;
}

export function planFefoDeduction(
  lots: StockLot[],
  wantedQty: number,
  forcedLotId?: string | null
): FefoPick[] {
  let remaining = wantedQty;
  const picks: FefoPick[] = [];

  if (forcedLotId) {
    const forced = lots.find((l) => l.id === forcedLotId && l.remainingQty > 0);
    if (forced) {
      const take = Math.min(forced.remainingQty, remaining);
      if (take > 0) {
        picks.push({ lotId: forced.id, qty: take });
        remaining -= take;
      }
    }
  }
  if (remaining <= 0) return picks;

  const ordered = [...lots]
    .filter((l) => l.remainingQty > 0)
    .sort((a, b) => expiryRank(a) - expiryRank(b));

  for (const lot of ordered) {
    if (remaining <= 0) break;
    if (forcedLotId && lot.id === forcedLotId) continue;
    const take = Math.min(lot.remainingQty, remaining);
    if (take > 0) {
      picks.push({ lotId: lot.id, qty: take });
      remaining -= take;
    }
  }
  if (remaining > 0)
    throw new Error("Stock insuficiente para a quantidade pedida.");
  return picks;
}
