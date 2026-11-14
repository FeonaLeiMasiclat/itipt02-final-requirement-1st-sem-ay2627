export type BorrowRequestStatus = 'Pending' | 'Approved' | 'Declined';

export interface BorrowRequest {
  id: string;
  bookTitle: string;
  requestedBy: string;
  requestedAt: string;
  status: BorrowRequestStatus;
}

const STORAGE_KEY = 'lmsBorrowRequests';

function isBorrowRequest(value: unknown): value is BorrowRequest {
  if (typeof value !== 'object' || value === null) return false;
  const request = value as Record<string, unknown>;
  return (
    typeof request['id'] === 'string' &&
    typeof request['bookTitle'] === 'string' &&
    typeof request['requestedBy'] === 'string' &&
    typeof request['requestedAt'] === 'string' &&
    (request['status'] === 'Pending' || request['status'] === 'Approved' || request['status'] === 'Declined')
  );
}

export function loadBorrowRequests(): BorrowRequest[] {
  const storedRequests = localStorage.getItem(STORAGE_KEY);
  if (storedRequests === null) return [];

  const parsedRequests: unknown = JSON.parse(storedRequests);
  if (!Array.isArray(parsedRequests) || !parsedRequests.every(isBorrowRequest)) {
    throw new Error('Saved borrow request data has an invalid format.');
  }
  return parsedRequests;
}

export function saveBorrowRequests(requests: BorrowRequest[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(requests));
}
