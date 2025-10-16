import { BottomSheetView } from '@gorhom/bottom-sheet';
import type { Message } from '@sophon-labs/account-communicator';
import { StyleSheet } from 'react-native';
import { useSophonAccount } from '../../hooks';
import { SignInModal } from './steps/sign-in.step';
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

  console.log('isConnected', isConnected, method, payload);

  const renderPage = () => {
    switch (method) {
      case 'eth_requestAccounts':
        return (
          <SignInModal
            onComplete={onComplete}
            onCancel={onCancel}
            onError={onError}
          />
        );
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
