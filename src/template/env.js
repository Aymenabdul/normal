// env.js
const ENV = {
  dev: {
    baseURL: 'http://192.168.1.10:8080',
  },
  prod: {
    baseURL: 'http://89.116.134.110:8081',
  },
};

// Export the environment variables based on the current environment
const getEnvVars = () => {
  // Assuming you are using `__DEV__` for development mode
  if (__DEV__) {
    return ENV.dev;
  }
  return ENV.prod;
};

export default getEnvVars();
