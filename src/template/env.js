// env.js
const ENV = {
  dev: {
    baseURL: 'https://app.wezume.in',
  },
  prod: {
    baseURL: 'https://app.wezume.in',
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
