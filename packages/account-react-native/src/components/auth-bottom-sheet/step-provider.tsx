import { BottomSheetView } from '@gorhom/bottom-sheet';
import { StyleSheet } from 'react-native';
import { useAuthSheet } from './auth-bottom-sheet';
import { SignInModal } from './steps/sign-in.step';

export function StepProvider() {
  const { currentStep } = useAuthSheet();

  const renderPage = () => {
    switch (currentStep) {
      case 'signIn':
        return <SignInModal />;
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
