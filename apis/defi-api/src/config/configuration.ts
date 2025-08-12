export const GetAppConfiguration = () => {
  return {
    port: process.env.PORT ? parseInt(process.env.PORT, 10) : 4001,
    bind: process.env.BIND_ADDR || '0.0.0.0',
    pathPrefix: process.env.PATH_PREFIX || '',
    exampleSecret: process.env.EXAMPLE_SECRET,
  };
};

export type AppConfiguration = ReturnType<typeof GetAppConfiguration>;
