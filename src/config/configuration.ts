export default () => ({
  API_KEY: process.env.API_KEY,
  API_SECRET: process.env.API_SECRET,
  IS_DEVELOPMENT: process.env.ENVIRONMENT === 'development',
});
