import { Platform } from "react-native";

/** Set EXPO_PUBLIC_API_URL to your computer's LAN IP for a physical device. */
export const API_URL =
  process.env.EXPO_PUBLIC_API_URL ||
  (Platform.OS === "android"
    ? "http://10.0.2.2:4000/api"
    : "http://localhost:4000/api");

export type Point = { latitude: number; longitude: number };
export type ApiRole = "consumer" | "producer" | "delivery" | "administrator";
export type ApiLanguage = "en" | "bn" | "hi" | "as" | "or" | "ne" | "ta" | "te";
export type ApiUser = {
  id: string;
  name: string;
  email: string;
  role: ApiRole;
  verified: boolean;
  deletionRequestedAt?: string;
  approved: boolean;
  active: boolean;
  farmName: string;
  address: string;
  city?: string;
  state?: string;
  postalCode?: string;
  phone: string;
  language: ApiLanguage;
  notifications: boolean;
  favorites: string[];
};
export type ApiProduct = {
  id: string;
  name: string;
  farm: string;
  producer: string;
  category: string;
  method: string;
  price: number;
  stock: number;
  minOrder: number;
  unit: "kg";
  location: string;
  pickupLocation?: Point;
  harvest: string;
  expiry?: string;
  image: string;
  active: boolean;
  deliveryOptions: ("delivery" | "pickup")[];
};
export type ApiOrder = {
  id: string;
  consumer: string;
  producer: string;
  driver: string | null;
  farm: string;
  status: string;
  method: "delivery" | "pickup";
  address: string;
  slot: string;
  payment: "cod" | "pickup";
  paymentStatus: "due" | "collected" | "void";
  subtotalPaise: number;
  deliveryPaise: number;
  discountPaise: number;
  totalPaise: number;
  handoverCode?: string;
  items: {
    product: string;
    name: string;
    quantity: number;
    pricePaise: number;
  }[];
};
export type AuthResponse = {
  user: ApiUser;
  accessToken: string;
  expiresAt: string;
};
export type CheckoutInput = {
  items: { productId: string; quantity: number }[];
  method: "delivery" | "pickup";
  address?: string;
  destinationLocation?: Point;
  slot: string;
  coupon?: "" | "FRESH10";
};
export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}

/** Token stays in memory. Use secure device storage if adding remembered login. */
export function createApiClient(baseUrl = API_URL) {
  let accessToken: string | null = null;
  async function request<T>(
    path: string,
    method = "GET",
    body?: unknown,
    extraHeaders: Record<string, string> = {},
  ): Promise<T> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000);
    try {
      const response = await fetch(baseUrl + path, {
        method,
        signal: controller.signal,
        headers: {
          ...(body !== undefined ? { "Content-Type": "application/json" } : {}),
          ...(accessToken ? { Authorization: "Bearer " + accessToken } : {}),
          ...extraHeaders,
        },
        ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
      });
      if (response.status === 204) return undefined as T;
      const payload = await response.json().catch(() => ({}));
      if (!response.ok)
        throw new ApiError(
          response.status,
          payload.error?.message || "Request failed",
        );
      return payload as T;
    } catch (error) {
      if (error instanceof ApiError) throw error;
      throw new ApiError(
        0,
        "Cannot reach the farm server. Check your connection and API address, then retry.",
      );
    } finally {
      clearTimeout(timeout);
    }
  }
  return {
    request,
    setToken(token: string | null) {
      accessToken = token;
    },
    async login(email: string, password: string) {
      const result = await request<AuthResponse>("/auth/login", "POST", {
        email,
        password,
      });
      accessToken = result.accessToken;
      return result;
    },
    register(input: {
      address?: string;
      city?: string;
      state?: string;
      postalCode?: string;
      language?: ApiLanguage;
      phone?: string;
      name: string;
      email: string;
      password: string;
      role: Exclude<ApiRole, "administrator">;
      farmName?: string;
    }) {
      return request<{
        user: ApiUser;
        challengeId: string;
        developmentCode?: string;
      }>("/auth/register", "POST", input);
    },
    async verify(challengeId: string, code: string) {
      const result = await request<AuthResponse>("/auth/verify", "POST", {
        challengeId,
        code,
      });
      accessToken = result.accessToken;
      return result;
    },
    async logout() {
      try {
        await request<void>("/auth/logout", "POST");
      } finally {
        accessToken = null;
      }
    },
    me: () => request<{ user: ApiUser }>("/users/me"),
    mine: (page = 1) =>
      request<{ products: ApiProduct[]; total: number }>(
        "/products/mine?page=" + page + "&limit=20",
      ),
    saveProduct: (input: ProductInput, id?: string) =>
      request<{ product: ApiProduct }>(
        "/products" + (id ? "/" + encodeURIComponent(id) : ""),
        id ? "PATCH" : "POST",
        input,
      ),
    deleteProduct: (id: string) =>
      request<void>("/products/" + encodeURIComponent(id), "DELETE"),
    pauseProduct: (id: string, active: boolean) =>
      request<{ product: ApiProduct }>(
        "/products/" + encodeURIComponent(id),
        "PATCH",
        { active },
      ),
    uploadImage: (base64: string) =>
      request<{ image: string }>("/images", "POST", { base64 }),
    products: (query = "") =>
      request<{
        products: ApiProduct[];
        total: number;
        page: number;
        limit: number;
      }>("/products" + (query ? "?" + query : "")),
    orders: () =>
      request<{
        orders: ApiOrder[];
        total: number;
        page: number;
        limit: number;
      }>("/orders"),
    checkout: (input: CheckoutInput, idempotencyKey: string) =>
      request<{ orders: ApiOrder[]; totalPaise: number; replayed: boolean }>(
        "/orders",
        "POST",
        input,
        { "Idempotency-Key": idempotencyKey },
      ),
    cancel: (orderId: string, reason: string) =>
      request<{ order: ApiOrder }>(
        "/orders/" + encodeURIComponent(orderId) + "/cancel",
        "POST",
        { reason },
      ),
    setStatus: (
      orderId: string,
      status: "Accepted" | "Preparing" | "Ready for Pickup",
    ) =>
      request<{ order: ApiOrder }>(
        "/orders/" + encodeURIComponent(orderId) + "/status",
        "PATCH",
        { status },
      ),
    complete: (orderId: string, code: string) =>
      request<{ order: ApiOrder }>(
        "/orders/" + encodeURIComponent(orderId) + "/complete",
        "POST",
        { code },
      ),
  };
}
export const api = createApiClient();

export type ProductInput = {
  name: string;
  category: string;
  method: string;
  price: number;
  stock: number;
  minOrder: number;
  location: string;
  pickupLocation?: Point;
  harvest: string;
  expiry?: string;
  image: string;
  active: boolean;
  deliveryOptions: ("delivery" | "pickup")[];
};
export function imageUrl(image: string) {
  return image.startsWith("/api/images/")
    ? API_URL.replace(/\/api\/?$/, "") + image
    : image;
}
