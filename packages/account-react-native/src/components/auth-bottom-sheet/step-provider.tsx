import { BottomSheetView } from '@gorhom/bottom-sheet';
import type { Message } from '@sophon-labs/account-communicator';
import { StyleSheet } from 'react-native';
import { useSophonAccount } from '../../hooks';
import { useSophonContext } from '../../hooks/use-sophon-context';
import { AuthorizationStep } from './steps/authorization-step';
import { ConsentStep } from './steps/consent-step';
import { SignInModal } from './steps/sign-in.step';
import { SignMessageStep } from './steps/sign-message';
import { TransactionStep } from './steps/transaction-step';
import type { BasicStepProps } from './types';

export interface StepProviderProps extends BasicStepProps {
  method: string;
  payload?: Message;
}

export function StepProvider({
  method,
  payload,
  onComplete,
  onCancel,
  onError,
}: StepProviderProps) {
  const { isConnected } = useSophonAccount();
  const { connectingAccount } = useSophonContext();

  console.log('isConnected', isConnected, method, payload);

  const renderPage = () => {
    console.log('method', method);
    switch (method) {
      case 'eth_requestAccounts':
      case 'wallet_requestPermissions':
        return isConnected || connectingAccount ? (
          <AuthorizationStep
            onCancel={onCancel}
            onComplete={onComplete}
            onError={onError}
          />
        ) : (
          <SignInModal
            onComplete={onComplete}
            onCancel={onCancel}
            onError={onError}
          />
        );
      case 'personal_sign':
      case 'eth_signTypedData_v4':
        return (
          <SignMessageStep
            onComplete={onComplete}
            onCancel={onCancel}
            onError={onError}
          />
        );
      case 'eth_sendTransaction':
        return (
          <TransactionStep
            onComplete={onComplete}
            onCancel={onCancel}
            onError={onError}
          />
        );
      case 'sophon_requestConsent':
        return (
          <ConsentStep
            onComplete={onComplete}
            onCancel={onCancel}
            onError={onError}
          />
        );
      // case 'wallet_revokePermissions':
      // case 'wallet_disconnect':
      default:
        return null;
    }
  };

  return (
    <BottomSheetView style={styles.sheetContent}>
      {renderPage()}
    </BottomSheetView>
  );
}
const styles = StyleSheet.create({
  sheetContent: { padding: 24 },
  navbar: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  back: { fontSize: 20, fontWeight: '600' },
  title: { flex: 1, textAlign: 'center', fontWeight: '600', fontSize: 16 },
});
