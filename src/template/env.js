// env.js
const ENV = {
  dev: {
    baseURL: 'http://wezume.in:8081',
  },
  prod: {
    baseURL: 'http://wezume.in:8081',
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
