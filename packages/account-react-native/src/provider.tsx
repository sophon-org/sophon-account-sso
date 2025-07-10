import { BottomSheetModalProvider } from '@gorhom/bottom-sheet';
import React, { createContext, useState, useMemo } from 'react';
import { StyleSheet } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

export const SophonAccountContext = createContext<{
  user: any;
  setUser: (user: any) => void;
}>({
  user: null,
  setUser: () => {},
});

export const SophonAccountProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const [user, setUser] = useState(null);

  const contextValue = useMemo(
    () => ({
      user,
      setUser,
    }),
    [user, setUser]
  );

  return (
    <GestureHandlerRootView
      style={styles.container}
      testID="sophon-account-gesture-handler-root-view"
    >
      <BottomSheetModalProvider>
        <SophonAccountContext.Provider value={contextValue}>
          {children}
        </SophonAccountContext.Provider>
      </BottomSheetModalProvider>
    </GestureHandlerRootView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
    justifyContent: 'center',
    backgroundColor: 'grey',
  },
  contentContainer: {
    flex: 1,
    alignItems: 'center',
  },
});
