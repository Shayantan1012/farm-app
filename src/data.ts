export type Product = {
  id: string;
  name: string;
  farm: string;
  category: string;
  price: number;
  stock: number;
  distance: number;
  method: string;
  image: string;
  rating: number;
  active: boolean;
  harvest: string;
};
export const products: Product[] = [
  {
    id: "1",
    name: "Fresh vine tomatoes",
    farm: "Green Valley Farm",
    category: "Vegetables",
    price: 40,
    stock: 24,
    distance: 2.4,
    method: "Organic",
    image:
      "https://images.unsplash.com/photo-1546094096-0df4bcaaa337?w=700&auto=format&fit=crop",
    rating: 4.9,
    active: true,
    harvest: "2026-09-12",
  },
  {
    id: "2",
    name: "Tender baby spinach",
    farm: "Sunrise Organics",
    category: "Leafy greens",
    price: 35,
    stock: 18,
    distance: 3.1,
    method: "Organic",
    image:
      "https://images.unsplash.com/photo-1576045057995-568f588f82fb?w=700&auto=format&fit=crop",
    rating: 4.8,
    active: true,
    harvest: "2026-09-12",
  },
  {
    id: "3",
    name: "Farm fresh carrots",
    farm: "Green Valley Farm",
    category: "Roots & tubers",
    price: 55,
    stock: 32,
    distance: 2.4,
    method: "Naturally grown",
    image:
      "https://images.unsplash.com/photo-1447175008436-054170c2e979?w=700&auto=format&fit=crop",
    rating: 4.8,
    active: true,
    harvest: "2026-09-11",
  },
  {
    id: "4",
    name: "Green broccoli",
    farm: "Meadow Fresh",
    category: "Vegetables",
    price: 80,
    stock: 12,
    distance: 4.6,
    method: "Organic",
    image:
      "https://images.unsplash.com/photo-1459411621453-7b03977f4bfc?w=700&auto=format&fit=crop",
    rating: 4.7,
    active: true,
    harvest: "2026-09-11",
  },
  {
    id: "5",
    name: "Golden potatoes",
    farm: "Sunrise Organics",
    category: "Roots & tubers",
    price: 30,
    stock: 45,
    distance: 3.1,
    method: "Conventionally grown",
    image:
      "https://images.unsplash.com/photo-1518977676601-b53f82aba655?w=700&auto=format&fit=crop",
    rating: 4.6,
    active: true,
    harvest: "2026-09-10",
  },
  {
    id: "6",
    name: "Garden bell peppers",
    farm: "Meadow Fresh",
    category: "Vegetables",
    price: 65,
    stock: 16,
    distance: 4.6,
    method: "Naturally grown",
    image:
      "https://images.unsplash.com/photo-1563565375-f3fdfdbefa83?w=700&auto=format&fit=crop",
    rating: 4.9,
    active: true,
    harvest: "2026-09-12",
  },
];
export type Order = {
  id: string;
  farm: string;
  items: { product: Product; qty: number }[];
  total: number;
  status: string;
  method: string;
  address: string;
  slot: string;
  payment: string;
  reason?: string;
};
export const stages = [
  "Pending",
  "Accepted",
  "Preparing",
  "Ready for Pickup",
  "Out for Delivery",
  "Delivered",
];
