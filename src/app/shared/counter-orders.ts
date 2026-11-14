export interface CounterOrderItem {
  title: string;
  author: string;
  price: number;
  quantity: number;
}

export interface CounterOrder {
  id: string;
  items: CounterOrderItem[];
  bookPrice: number;
  total: number;
  pickupLocation: string;
  paymentMethod: string;
  createdAt: string;
}

const COUNTER_ORDERS_STORAGE_KEY = 'lmsCounterOrders';

function isCounterOrderItem(value: unknown): value is CounterOrderItem {
  if (typeof value !== 'object' || value === null) return false;
  const item = value as Record<string, unknown>;
  return (
    typeof item['title'] === 'string' &&
    typeof item['author'] === 'string' &&
    typeof item['price'] === 'number' &&
    typeof item['quantity'] === 'number'
  );
}

function isCounterOrder(value: unknown): value is CounterOrder {
  if (typeof value !== 'object' || value === null) return false;
  const order = value as Record<string, unknown>;
  return (
    typeof order['id'] === 'string' &&
    Array.isArray(order['items']) &&
    order['items'].every(isCounterOrderItem) &&
    typeof order['bookPrice'] === 'number' &&
    typeof order['total'] === 'number' &&
    typeof order['pickupLocation'] === 'string' &&
    typeof order['paymentMethod'] === 'string' &&
    typeof order['createdAt'] === 'string'
  );
}

export function loadCounterOrders(): CounterOrder[] {
  const storedOrders = localStorage.getItem(COUNTER_ORDERS_STORAGE_KEY);
  if (storedOrders === null) return [];

  const parsedOrders: unknown = JSON.parse(storedOrders);
  if (!Array.isArray(parsedOrders) || !parsedOrders.every(isCounterOrder)) {
    throw new Error('Saved counter order data has an invalid format.');
  }
  return parsedOrders;
}

export function saveCounterOrders(orders: CounterOrder[]): void {
  localStorage.setItem(COUNTER_ORDERS_STORAGE_KEY, JSON.stringify(orders));
}
