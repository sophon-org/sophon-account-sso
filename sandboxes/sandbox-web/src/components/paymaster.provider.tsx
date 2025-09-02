import { createContext, type ReactNode, useContext, useState } from 'react';

interface PaymasterContextType {
  paymasterEnabled: boolean;
  setPaymasterEnabled: (enabled: boolean) => void;
}

const PaymasterContext = createContext<PaymasterContextType | undefined>(
  undefined,
);

export function PaymasterProvider({ children }: { children: ReactNode }) {
  const [paymasterEnabled, setPaymasterEnabled] = useState(false);

  return (
    <PaymasterContext.Provider
      value={{ paymasterEnabled, setPaymasterEnabled }}
    >
      {children}
    </PaymasterContext.Provider>
  );
}

export function usePaymaster() {
  const context = useContext(PaymasterContext);
  if (context === undefined) {
    throw new Error('usePaymaster must be used within a PaymasterProvider');
  }
  return context;
}
