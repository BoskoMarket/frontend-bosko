import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import {
  fetchPaymentMethods,
  addPaymentMethod,
  removePaymentMethod,
  subscribeToPro,
  fetchInvoices,
  PaymentMethod,
} from "../services/payments";

/**
 * PaymentsContext
 *
 * Manages payment-related state and actions, such as the list of
 * payment methods, subscription status, and invoices. Components
 * that need to read or update payment details can consume this
 * context. Note that subscription flows often involve third-party
 * redirects; those actions can still be initiated from within
 * functions exposed here.
 */

interface PaymentsState {
  methods: PaymentMethod[];
  invoices: any[];
  loading: boolean;
  loadMethods: () => Promise<void>;
  loadInvoices: () => Promise<void>;
  addMethod: (payload: any) => Promise<PaymentMethod>;
  removeMethod: (id: string) => Promise<void>;
  subscribe: () => Promise<{ status: string; clientSecret?: string }>;
}

const PaymentsContext = createContext<PaymentsState | undefined>(undefined);

export const PaymentsProvider = ({ children }: { children: ReactNode }) => {
  const [methods, setMethods] = useState<PaymentMethod[]>([]);
  const [invoices, setInvoices] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(false);

  const loadMethods = async () => {
    setLoading(true);
    try {
      const data = await fetchPaymentMethods();
      setMethods(data);
    } finally {
      setLoading(false);
    }
  };

  const loadInvoices = async () => {
    setLoading(true);
    try {
      const data = await fetchInvoices();
      setInvoices(data);
    } finally {
      setLoading(false);
    }
  };

  const addMethod = async (payload: any) => {
    const method = await addPaymentMethod(payload);
    setMethods((prev) => [...prev, method]);
    return method;
  };

  const removeMethodById = async (id: string) => {
    await removePaymentMethod(id);
    setMethods((prev) => prev.filter((m) => m.id !== id));
  };

  const subscribe = async () => {
    const result = await subscribeToPro();
    return result;
  };

  // useEffect(() => {
  //   loadMethods().catch((err) => console.error(err));
  // }, []);

  const value: PaymentsState = {
    methods,
    invoices,
    loading,
    loadMethods,
    loadInvoices,
    addMethod,
    removeMethod: removeMethodById,
    subscribe,
  };

  return (
    <PaymentsContext.Provider value={value}>
      {children}
    </PaymentsContext.Provider>
  );
};

export const usePayments = () => {
  const context = useContext(PaymentsContext);
  if (context === undefined) {
    throw new Error("usePayments must be used within a PaymentsProvider");
  }
  return context;
};
