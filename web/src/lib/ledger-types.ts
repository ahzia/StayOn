export type LedgerStatus = 'pending' | 'confirmed' | 'canceled';

export type LedgerEntry = {
  transId: string;
  userId: string;
  status: LedgerStatus;
  cpxStatus: string;
  type: string;
  amountUsd: number;
  amountLocal: number;
  tokens: number;
  offerId: string;
  subId1: string;
  subId2: string;
  ipClick: string;
  synced: boolean;
  createdAt: string;
  updatedAt: string;
};
