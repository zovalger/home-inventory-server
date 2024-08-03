import * as Joi from 'joi';

export const JoiValidationsSchema = Joi.object({
  PORT: Joi.number().default(3000),
  HOST_API: Joi.string().required(),

  DB_PASSWORD: Joi.string().required(),
  DB_NAME: Joi.string().required(),
  DB_HOST: Joi.string().required(),
  DB_PORT: Joi.number().default(5432),
  DB_USERNAME: Joi.string().required(),

  JWT_SECRET: Joi.string().required(),
  JWT_EXPIRE_TIME: Joi.string().default('2h'),

  SENDER_EMAIL: Joi.string().email().required(),
  SENDER_EMAIL_PASSWORD: Joi.string().required(),

  CLOUDINARY_CLOUD_NAME: Joi.string().required(),
  CLOUDINARY_API_KEY: Joi.string().required(),
  CLOUDINARY_API_SECRET: Joi.string().required(),
});
