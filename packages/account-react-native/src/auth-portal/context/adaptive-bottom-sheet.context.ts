import { createContext, useContext } from 'react';

export type AdaptiveSheetMode = 'modal' | 'bottomSheet';

interface AdaptiveBottomSheetContextProps {
  mode: AdaptiveSheetMode;
}

const AdaptiveBottomSheetContext =
  createContext<AdaptiveBottomSheetContextProps>({
    mode: 'bottomSheet', // default
  });

export const useAdaptiveBottomSheetMode = () =>
  useContext(AdaptiveBottomSheetContext);

export const AdaptiveBottomSheetProvider = AdaptiveBottomSheetContext.Provider;
