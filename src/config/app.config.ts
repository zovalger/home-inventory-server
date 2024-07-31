export const EnvConfiguration = () => ({
  environment: process.env.NODE_ENV || 'dev',
  port: process.env.PORT,
  host_api: process.env.HOST_API,
  db_password: process.env.DB_PASSWORD,
  db_name: process.env.DB_NAME,
  db_host: process.env.DB_HOST,
  db_port: process.env.DB_PORT,
  db_username: process.env.DB_USERNAME,

  sender_email: process.env.SENDER_EMAIL,
  sender_email_password: process.env.SENDER_EMAIL_PASSWORD,
});
