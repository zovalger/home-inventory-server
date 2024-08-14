export const EnvConfiguration = () => ({
  environment: process.env.NODE_ENV || 'dev',
  port: process.env.PORT,
  host_api: process.env.HOST_API,

  db_username: process.env.DB_USERNAME,
  db_password: process.env.DB_PASSWORD,
  db_name: process.env.DB_NAME,
  db_host: process.env.DB_HOST,
  db_port: process.env.DB_PORT,

  test_db_username: process.env.TEST_DB_USERNAME,
  test_db_password: process.env.TEST_DB_PASSWORD,
  test_db_name: process.env.TEST_DB_NAME,
  test_db_host: process.env.TEST_DB_HOST,
  test_db_port: process.env.TEST_DB_PORT,

  sender_email: process.env.SENDER_EMAIL,
  sender_email_password: process.env.SENDER_EMAIL_PASSWORD,

  jwt_secret: process.env.JWT_SECRET,
  jwt_expire_time: process.env.JWT_EXPIRE_TIME,

  cloudinary_cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  cloudinary_api_key: process.env.CLOUDINARY_API_KEY,
  cloudinary_api_secret: process.env.CLOUDINARY_API_SECRET,
});
