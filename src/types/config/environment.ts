export type EnvConfig = {
  app: {
    env: string;
    port: number;
    name: string;
    version: string;
    url: string;
  };
  database: {
    url: string;
  };
  jwt: {
    secret: string;
    refreshSecret: string;
    expire: string;
    refreshExpire: string;
  };
  security: {
    bcryptRounds: number;
  };
  cors: {
    origin: string[];
  };
  rateLimit: {
    windowMs: number;
    maxRequests: number;
  };
  logging: {
    level: string;
    file: {
      maxSize: string;
      maxFiles: string;
    };
  };
  upload: {
    maxSize: string;
    path: string;
  };
};

export type NodeEnv = 'development' | 'production' | 'test';