import * as Joi from 'joi';

export const JoiValidationsSchema = Joi.object({
  PORT: Joi.number().default(3000),
  HOST_API: Joi.string().required(),
  DB_PASSWORD: Joi.string().required(),
  DB_NAME: Joi.string().required(),
  DB_HOST: Joi.string().required(),
  DB_PORT: Joi.number().default(5432),
  DB_USERNAME: Joi.string().required(),
});
