import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import {
  fetchOrders,
  fetchOrderById,
  createOrder,
  updateOrder,
  deleteOrder,
  Order,
} from "../services/oders";

/**
 * OrdersContext
 *
 * Manages orders (requests) for both clients and pros. Provides
 * functions to fetch, create, update, and delete orders. The
 * provider maintains a list of orders in its state and exposes
 * helpers to refresh or mutate the list.
 */

interface OrdersState {
  orders: Order[];
  loading: boolean;
  loadOrders: (filters?: Record<string, any>) => Promise<void>;
  getOrder: (id: string) => Promise<Order | undefined>;
  addOrder: (order: Omit<Order, "id" | "status">) => Promise<Order>;
  editOrder: (id: string, updates: Partial<Order>) => Promise<Order>;
  removeOrder: (id: string) => Promise<void>;
}

const OrdersContext = createContext<OrdersState | undefined>(undefined);

export const OrdersProvider = ({ children }: { children: ReactNode }) => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState<boolean>(false);

  const loadOrders = async (filters?: Record<string, any>) => {
    setLoading(true);
    try {
      const data = await fetchOrders(filters);
      setOrders(data);
    } finally {
      setLoading(false);
    }
  };

  const getOrder = async (id: string) => {
    try {
      return await fetchOrderById(id);
    } catch (err) {
      console.error("Failed to fetch order", err);
      return undefined;
    }
  };

  const addOrder = async (order: Omit<Order, "id" | "status">) => {
    const newOrder = await createOrder(order);
    setOrders((prev) => [...prev, newOrder]);
    return newOrder;
  };

  const editOrder = async (id: string, updates: Partial<Order>) => {
    const updated = await updateOrder(id, updates);
    setOrders((prev) => prev.map((o) => (o.id === id ? updated : o)));
    return updated;
  };

  const removeOrder = async (id: string) => {
    await deleteOrder(id);
    setOrders((prev) => prev.filter((o) => o.id !== id));
  };

  // useEffect(() => {
  //   loadOrders().catch((err) => console.error(err));
  // }, []);

  const value: OrdersState = {
    orders,
    loading,
    loadOrders,
    getOrder,
    addOrder,
    editOrder,
    removeOrder,
  };

  return (
    <OrdersContext.Provider value={value}>{children}</OrdersContext.Provider>
  );
};

export const useOrders = () => {
  const context = useContext(OrdersContext);
  if (context === undefined) {
    throw new Error("useOrders must be used within an OrdersProvider");
  }
  return context;
};
