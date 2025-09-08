export const GetAppConfiguration = () => {
  return {
    port: process.env.PORT ? Number.parseInt(process.env.PORT, 10) : 4001,
    bind: process.env.BIND_ADDR || '0.0.0.0',
    pathPrefix: process.env.PATH_PREFIX || '',
    providers: {
      swaps: {
        enabled: process.env.SWAPS_ENABLED === 'true',
        apiKey: process.env.SWAPS_API_KEY || '',
        baseUrlAction: process.env.SWAPS_BASE_URL_ACTION || '',
        baseUrlStatus: process.env.SWAPS_BASE_URL_STATUS || '',
        priority: Number.parseInt(process.env.SWAPS_PRIORITY || '1', 10),
      },
    },
  };
};

export type AppConfiguration = ReturnType<typeof GetAppConfiguration>;
