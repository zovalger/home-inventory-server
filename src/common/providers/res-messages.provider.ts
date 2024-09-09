import { Injectable } from '@nestjs/common';

@Injectable()
export class ResMessages {
  // ************************** genericos **************************

  notFound = 'Not found';
  static objectEmpty = 'object is empty';
  objectEmpty = 'object is empty';

  // ************************** files **************************
  static fileTooLarge = (bytes: number) =>
    `expected size is less than ${bytes} Bytes`;

  fileTooLarge = (bytes: number) => `expected size is less than ${bytes} Bytes`;

  imageNotFound = "The image isn't registed in DB";

  // ************************** users **************************

  // errors
  userIncorrectLogin = 'email or password incorrect';
  static userNotFound = 'User not found';
  userNotFound = 'User not found';
  userUnauthorized = 'User Unauthorized';
  userForbidden = 'You not have authorization';
  static userNotVerify = "User isn't verified";
  userNotVerify = "User isn't verified";
  userAlreadyRegisted = 'user is already registed';
  userAlreadyVerified = 'The user is already verified';

  // confirmations
  userRegisterSuccess = 'User registered successfully';
  userLoginSuccess = 'Login success';
  userProfileObtained = 'Profile obtained';
  userUpdated = 'user updated';

  // ******* codigos *******
  // errors
  userVerifyCodeNotFound = "Verification code isn't not exits";
  userVerifyCodeExpired = 'Verification code is expired';

  // confirmations
  userVerifySuccess = 'user verify success';
  verifyCodeResend = (email: string) =>
    `forwarded verification code to email ${email}`;

  // ************************** company **************************

  companyNotFound = 'companyNotFound';
  companyAlreadyExist = 'companyAlreadyExist';
  usetIsNotOuwnerOfCompany = 'usetIsNotOuwnerOfCompany';

  companyCreated = 'companyCreated';
  companiesObtained = 'companiesObtained';
  companyUpdated = 'companyUpdated';

  // ************************** company locations **************************

  companyLocationNotFound = 'companyLocationNotFound';

  companyLocationHasCreated = 'companyLocationHasCreated';

  // userAlreadyInFamilyGroup = 'The user already has a family group';

  // familyNotFound = 'Family not found';
  // userForbiddenToFamily = 'The user is forbidden for this family';
  // userUnauthorizedToFamily = "The user isn't authorized for this family";
  // userNotHavePermisionInFamily =
  //   'The user not has permission in family group for this action';

  // // confirmations

  // familyObtained = 'family data obtained';

  // ************************** members **************************

  memberNotFound = 'Members not found';

  familyNotHaveMembers = 'The family not have members';

  isAlreadyMember = 'the user is already member of this family';
  memberHasOtherFamily =
    'The user already has a family group they must leave the other family group to be able to accept this invitation.';

  // ************************** invitations **************************

  invitationNotFound = 'Invitation no found';

  notUserToInvite = 'no users to invite';

  rejecteInvitation = 'The invitations is rejected';
  invitationIsNotActive = "The invitation isn't active";

  // ************************** products **************************

  productCreated = 'productCreated';

  productAlreadyExist = 'the product already exist';
  productsNotFound = 'the one the products are not founds';
  productsAreDifferentFamily = 'The products are from different family groups';

  productsHasManyLevelsEquivalences =
    'the products have more levels of equivalences than allowed';
  productsHasCircularEquivalences =
    "the products have and circular equivalences isn't allowed";

  productHasRelations = (productNames: string[]) =>
    `This product have relations with "${productNames}"`;

  // ************************** transaccione **************************

  transactionFailed = 'transaction failed';
  TransactionNotFound = 'Transaction not found';
  NotHaveStock = "You don't have enough stock";
  transactionNotHaveStock =
    'The selected transaction does not have enough stock';
  transactionRefInvalid = 'The selected transaction does not valid type';

  transactionHaveReferences = 'Transaction Have References';
}
