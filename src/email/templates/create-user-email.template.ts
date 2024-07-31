import { CreateUserEmailDto } from '../dto';

export const CreateUserEmailTemplate = (
  createUserEmailDto: CreateUserEmailDto,
): string => {
  const { user, verificationCode } = createUserEmailDto;
  const { code } = verificationCode;

  //todo: enviar codigo de verificacion

  return `<h1>usuario registrado</h1>
  <pre>${JSON.stringify(user)}</pre>
  <br/>
  <p> codigo de verificacion ${code}</p>

  `;
};
