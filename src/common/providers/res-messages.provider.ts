import { Injectable } from '@nestjs/common';

@Injectable()
export class ResMessages {
  // ************************** genericos **************************

  notFound = 'Not found';

  // ************************** files **************************
  imageNotFound = "The image isn't registed in DB";

  // ************************** users **************************

  // errors
  userIncorrectLogin = 'email or password incorrect';
  userNotFound = 'User not found';
  userForbidden = 'You not have authorization';
  userAlreadyRegisted = 'user is already registed';
  userAlreadyVerified = 'The user is already verified';

  // confirmations
  userRegisterSuccess = 'User registered successfully';
  userLoginSuccess = 'Login success';
  userProfileObtained = 'Profile obtained';

  // ******* codigos *******
  // errors
  userVerifyCodeNotFound = "Verification code isn't not exits";
  userVerifyCodeExpired = 'Verification code is expired';

  // confirmations
  userVerifySuccess = 'user verify success';

  // ************************** family **************************

  familyNotFound = 'Family not found';

  userForbiddenToFamily = 'The user is forbidden for this family';

  userUnauthorizedToFamily = "The user isn't authorized for this family";

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

  productAlreadyExist = 'the product already exist';
  productsNotFound = 'the one the products are not founds';
  productsAreDifferentFamily = 'The products are from different family groups';

  productsHasManyLevelsEquivalences =
    'the products have more levels of equivalences than allowed';
  productsHasCircularEquivalences =
    "the products have and circular equivalences isn't allowed";

  productHasRelations(productNames: string[]) {
    return `This product have relations with "${productNames}"`;
  }

  // ************************** transaccione **************************

  transactionFailed = 'transaction failed';
  TransactionNotFound = 'Transaction not found';
  NotHaveStock = "You don't have enough stock";
  transactionNotHaveStock =
    'The selected transaction does not have enough stock';
  transactionRefInvalid = 'The selected transaction does not valid type';

  transactionHaveReferences = 'Transaction Have References';
}
