export enum ResMessages {
  // ************************** files **************************
  ImageNotFound = "The image isn't registed in DB",

  // ************************** users **************************
  UserNotFound = 'User not found',

  UserForbidden = 'You not have authorization',

  UserAlreadyVerified = 'The user is already verified',

  // ************************** family **************************

  familyNotFound = 'Family not found',

  UserForbiddenToFamily = 'The user is forbidden for this family',

  UserUnauthorizedToFamily = "The user isn't authorized for this family",

  // ************************** members **************************

  memberNotFound = 'Members not found',

  familyNotHaveMembers = 'The family not have members',

  isAlreadyMember = 'the user is already member of this family',
  memberHasOtherFamily = 'The user already has a family group, they must leave the other family group to be able to accept this invitation.',

  // ************************** invitations **************************

  invitationNotFound = 'Invitation no found',

  notUserToInvite = 'no users to invite',

  rejecteInvitation = 'The invitations is rejected',
  invitationIsNotActive = "The invitation isn't active",

  // ************************** products **************************

  productAlreadyExist = 'the product already exist',
}
