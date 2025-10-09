export type ConsentClaims = {
  pa?: number; // PERSONALIZATION_ADS
  sd?: number; // SHARING_DATA
};

export type DecodedToken = {
  c?: ConsentClaims;
  [key: string]: unknown;
};

export type ConsentResponse = {
  id: string;
  content: {
    result?: {
      consentAds: boolean;
      consentData: boolean;
    };
    error?: {
      message: string;
      code: number;
    };
  };
};
