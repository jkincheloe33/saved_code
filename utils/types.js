// When people are associated with an account, they are assigned an access level.  NOTE: REVIEWER is never assigned to anyone, here for documentation
const ACCOUNT_ACCESS_LEVELS = {
  // This is an external reviewer, should not have access to anthing but the review portal
  // NOTE: THIS SHOULD NEVER BE ASSIGNED TO SOMEONE; HERE FOR DOCUMENTATION OF LEVELS
  REVIEWER: 0,

  // An employee that logs into Wambi.
  TEAM_MEMBER: 1,

  // A Wambi client user that has elevated permissions to make administration and configuration changes for a single Wambi account.
  CLIENT_ADMIN: 4,

  // A Wambi employee that has elevated permissions to perform team member and group owner functions on behalf of other users in a specific Account to aid in managing a good client relationship. They cannot make configuration changes.
  ACCOUNT_MANAGER: 5,

  // A Wambi employee that can make configuration changes to one or more Wambi accounts. System Admins users are created by a Global System Admin and linked to specific Client Accounts.
  SYSTEM_ADMIN: 6,

  // These users have complete Global System Administration capabilities and can make configuration, account, and user changes to all accounts. Global System Admins can switch to any account to make changes.
  GLOBAL_SYSTEM_ADMIN: 7,
}

// This array is constructed so the index of the number is equal to the value of the access level...EK
const ACCOUNT_ACCESS_LEVELS_ARRAY = [
  ACCOUNT_ACCESS_LEVELS.REVIEWER,
  ACCOUNT_ACCESS_LEVELS.TEAM_MEMBER,
  null,
  null,
  ACCOUNT_ACCESS_LEVELS.CLIENT_ADMIN,
  ACCOUNT_ACCESS_LEVELS.ACCOUNT_MANAGER,
  ACCOUNT_ACCESS_LEVELS.SYSTEM_ADMIN,
  ACCOUNT_ACCESS_LEVELS.GLOBAL_SYSTEM_ADMIN,
]

const CELEBRATION_TYPES = {
  CHALLENGE_COMPLETE: 1,
  PERFECT_SCORE: 2,
  HOT_STREAK: 3,
}

const CHALLENGE_PROGRESS_STATUS = {
  ACTIVE: 0,
  COMPLETE: 1,
}

const CHALLENGE_STATUS = {
  DRAFT: 0,
  ACTIVE: 1,
  COMPLETE: 2,
  REMOVED: 3,
}

const CHALLENGE_WHO_CAN_COMPLETE = {
  ANYONE: 0,
  TEAM_MEMBERS: 1,
  OWNERS: 2,
}

const CPC_STATUS = {
  IN_REVIEW: 0,
  APPROVED: 1,
  HIDDEN: 2,
}

const CPC_TYPES_STATUS = {
  INACTIVE: 0,
  ACTIVE: 1,
  REMOVED: 2,
}

const CPC_TYPES_WHO_CAN_SEND = {
  ANYONE: 0,
  TEAM_MEMBER: 1,
  OWNER: 2,
  REVIEWER: 4,
}

const EMAIL_CAMPAIGN_SYNC_STATUS = {
  DISABLED: 0,
  ENABLED: 1,
}

const FEED_ITEM_DRAFT_STATUS = {
  NOT_READY: 0,
  READY: 1,
  VIDEO_PROCESSING: 2,
  QUEUED: 3,
  FAILED: 4,
}

const FEED_ITEM_SOURCE = {
  MANUAL: 0,
  DRAFT: 1,
  SCHEDULED: 2,
}

const FEED_ITEM_STATUS = {
  HIDDEN: 0,
  VISIBLE: 1,
  NON_PUBLIC: 2,
}

const FEED_ITEM_STATUS_ARRAY = ['Hidden', 'Visible', 'Not shared on newsfeed']

const FEED_ITEM_TYPES = {
  ANNOUNCEMENT: 1,
  CELEBRATION: 2,
  CPC: 3,
  POST_WIDGET: 4,
  SHARED_WAMBI: 5,
}

const FOLLOW_UP_STATUS = {
  NONE: 0,
  REQUESTED: 1,
  COMPLETED: 2,
}

// When people are associated directly with groups, there is a link type.  Additional meta data will be stored on that linker object too...EK
const GROUP_ACCESS_LEVELS = {
  // An employee that logs into Wambi.
  TEAM_MEMBER: 1,

  // A team member that has been assigned as a delegate owner of one or more groups by that group’s owner.
  GROUP_OWNER_DELEGATE: 2,

  // A team member that is the owner of one or more groups.
  GROUP_OWNER: 3,
}

// This array is constructed so the index of the number is equal to the value of the access level...EK
const GROUP_ACCESS_LEVELS_ARRAY = [
  null,
  GROUP_ACCESS_LEVELS.TEAM_MEMBER,
  GROUP_ACCESS_LEVELS.GROUP_OWNER_DELEGATE,
  GROUP_ACCESS_LEVELS.GROUP_OWNER,
]

const GROUP_ACCESS_LEVELS_ARRAY_NAMES = [null, 'Member', 'Delegate', 'Owner']

// These are the flags that tell if settings set at the group level are local or inherited to children...EK
const GROUP_SETTING_SCOPES = {
  LOCAL: 0,
  LOCAL_AND_DESCENDANTS: 1,
}

const INSIGHT_STATUS = {
  ACTIVE: 1,
  ADDRESSED: 2,
  DISMISSED: 3,
  EXPIRED: 4,
}

const INSIGHT_TYPE = {
  SEND_SPECIFIC_CPC: 1,
  SEND_SPECIFIC_PEOPLE_CPC: 2,
  SEND_CPC: 3,
  VIEW_RECENT_CPCS: 4,
  SEND_ANNOUNCEMENT: 5,
  VIEW_LESSONS: 10,
  VIEW_SPECIFIC_LESSON: 11,
  CHANGE_PASSWORD: 20,
  REVIEW_PROFILE: 30,
  SHOW_FEEDBACK: 40,
}

const LANGUAGE_TYPE = {
  PATIENT: 0,
  PORTAL_BUTTON: 1,
  SELF_REGISTERED_USER: 2,
  WHAT_IS_A_SELF_REGISTERED_USER: 3,
  SELF_REGISTER_SIGN_UP_BUTTON_TEXT: 4,
}

const LESSON_STATUS = {
  DRAFT: 0,
  PUBLISHED: 1,
  ARCHIVED: 2,
}

const LESSON_WHO_CAN_SEE = {
  ANYONE: 0,
  TEAM_MEMBERS: 1,
  OWNERS: 2,
}

const NEWSFEED_VIEW = {
  VIEW_ALL: 1,
  DETAILS: 2,
  RECIPIENTS: 3,
  COMMENTS: 4,
}

const NOTIFICATION_STATUS = {
  UNREAD: 0,
  READ: 1,
}

const NOTIFICATION_TYPE = {
  GENERIC: 0,
  CHALLENGE_ISSUED: 10,
  CHALLENGE_COMPLETED: 11,
  POST_PRIVATE_CPC: 20,
  PEER_CPC_SENT: 21,
  PATIENT_CPC_SENT: 22,
  CPC_COMMENTED: 23,
  CPC_REACTION: 24,
  POST_ANNOUNCEMENT: 25,
  ANNOUNCEMENT_COMMENTED: 26,
  ANNOUNCEMENT_REACTION: 27,
  PROFILE_APPROVAL_NEEDED: 30,
  PROFILE_APPROVED: 31,
  PROFILE_DENIED: 32,
  SURVEY_FOLLOW_UP: 40,
  CPC_SHARED: 41,
  RECEIVE_GIFT: 50,
  RAFFLE_WINNER: 51,
  REWARD_REMINDER: 52,
  SURVEY_PERFECT_SCORE: 55,
  SURVEY_HOT_STREAK: 56,
  MANAGER_HOT_STREAK: 57,
}

const PEOPLE_GROUP_PRIMARY_TYPES = {
  NONE: 0,
  COST: 1,
  ORG: 2,
}

/*
Priority notifications:
  - Notifications that appear on top of unread notification
  - Can only be read if they are pressed on
  Add to this list to add more priority notifications...CY
*/
const PRIORITY_NOTIFICATIONS = [
  NOTIFICATION_TYPE.SURVEY_FOLLOW_UP,
  NOTIFICATION_TYPE.PROFILE_APPROVAL_NEEDED,
  NOTIFICATION_TYPE.REWARD_REMINDER,
]

const PROFILE_CHANGE_REQUEST_TYPE = {
  NAME_ONLY: 0,
  PHOTO_ONLY: 1,
  NAME_AND_PHOTO: 2,
}

const PROFILE_CHANGE_REQUEST_TYPE_NAMES = ['name', 'photo', 'name and photo']

const PRONOUNS = {
  NO_PREFERENCE: 0,
  SHE_HER_HERS: 1,
  HE_HIM_HIS: 2,
  THEY_THEM_THEIRS: 3,
  XE_XEM_XYRS: 4,
  ZE_HIR_HISI: 5,
}

const PRONOUNS_ARRAY = [
  PRONOUNS.NO_PREFERENCE,
  PRONOUNS.SHE_HER_HERS,
  PRONOUNS.HE_HIM_HIS,
  PRONOUNS.THEY_THEM_THEIRS,
  PRONOUNS.XE_XEM_XYRS,
  PRONOUNS.ZE_HIR_HISI,
]

const PRONOUNS_ARRAY_NAMES = ['No preference', 'She/Her/Hers', 'He/Him/His', 'They/Them/Theirs', 'Xe/Xem/Xyrs', 'Ze/Hir/Hisi']

const REACTIONS_STATUS = {
  INACTIVE: 0,
  ACTIVE: 1,
}

const REWARD_GIFT_STATUS = {
  DRAFT: 0,
  ACTIVE: 1,
  ARCHIVED: 2,
  MANUAL: 3,
}

const SYSTEM_MESSAGE_TYPE = {
  INFO: 0,
  WARNING: 1,
}

const SYSTEM_MESSAGE_TYPE_NAMES = ['Info', 'Warning']

const TRIGGERS = {
  MANUAL: 0,
  AUTH_SIGN_IN: 1,
  PROFILE_ADD_IMAGE: 10,
  PROFILE_ADD_MOBILE: 11,
  PROFILE_ADD_BIRTHDAY: 12,
  PROFILE_ADD_DISPLAY_NAME: 13,
  CPC_SEND: 20,
  CPC_RECEIVE: 21,
  CPC_RECEIVE_FROM_REVIEW: 22,
  CPC_COMMENT: 23,
  CPC_REACT: 24,
  CPC_GOT_SHARED: 25,
  CPC_SHARE: 26,
  CPC_VIEW_ALL: 27,
  ANNOUNCEMENT_POST: 30,
  ANNOUNCEMENT_COMMENT: 31,
  ANNOUNCEMENT_REACT: 32,
  REVIEW_PERFECT_SCORE: 40,
  REVIEW_HOT_STREAK: 41,
  REVIEW_GOT_NOMINATED: 42,
  REVIEW_OWNER_COLLECT: 43,
  LESSON_COMPLETE: 50,
}

const USER_NOTIFY_METHODS = {
  NONE: 0,
  TEXT_AND_EMAIL: 1,
  TEXT_ONLY: 2,
  EMAIL_ONLY: 3,
}

const USER_NOTIFY_METHODS_ARRAY = [
  USER_NOTIFY_METHODS.NONE,
  USER_NOTIFY_METHODS.TEXT_AND_EMAIL,
  USER_NOTIFY_METHODS.TEXT_ONLY,
  USER_NOTIFY_METHODS.EMAIL_ONLY,
]

const USER_NOTIFY_METHODS_ARRAY_NAMES = ['None', 'Text & Email', 'Text only', 'Email only']

const USER_STATUS = {
  ACTIVE: 1,
  DISABLED: 2,
}

const WIDGET_TYPES = {
  LINE_CHART: 1,
  PERCENTAGE_TOTAL: 2,
  NUMBER: 3,
  PERCENT_BAR_CHART: 4,
}

// NOTE: This must be exported this way because this is shared between client and nodeJS server side...EK
module.exports = {
  ACCOUNT_ACCESS_LEVELS,
  ACCOUNT_ACCESS_LEVELS_ARRAY,
  CELEBRATION_TYPES,
  CHALLENGE_PROGRESS_STATUS,
  CHALLENGE_STATUS,
  CHALLENGE_WHO_CAN_COMPLETE,
  CPC_STATUS,
  CPC_TYPES_STATUS,
  CPC_TYPES_WHO_CAN_SEND,
  EMAIL_CAMPAIGN_SYNC_STATUS,
  FEED_ITEM_DRAFT_STATUS,
  FEED_ITEM_SOURCE,
  FEED_ITEM_STATUS,
  FEED_ITEM_STATUS_ARRAY,
  FEED_ITEM_TYPES,
  FOLLOW_UP_STATUS,
  GROUP_ACCESS_LEVELS,
  GROUP_ACCESS_LEVELS_ARRAY,
  GROUP_ACCESS_LEVELS_ARRAY_NAMES,
  GROUP_SETTING_SCOPES,
  INSIGHT_STATUS,
  INSIGHT_TYPE,
  LANGUAGE_TYPE,
  LESSON_STATUS,
  LESSON_WHO_CAN_SEE,
  NEWSFEED_VIEW,
  NOTIFICATION_STATUS,
  NOTIFICATION_TYPE,
  PEOPLE_GROUP_PRIMARY_TYPES,
  PRIORITY_NOTIFICATIONS,
  PROFILE_CHANGE_REQUEST_TYPE,
  PROFILE_CHANGE_REQUEST_TYPE_NAMES,
  PRONOUNS,
  PRONOUNS_ARRAY,
  PRONOUNS_ARRAY_NAMES,
  REACTIONS_STATUS,
  REWARD_GIFT_STATUS,
  SYSTEM_MESSAGE_TYPE,
  SYSTEM_MESSAGE_TYPE_NAMES,
  TRIGGERS,
  USER_NOTIFY_METHODS,
  USER_NOTIFY_METHODS_ARRAY,
  USER_NOTIFY_METHODS_ARRAY_NAMES,
  USER_STATUS,
  WIDGET_TYPES,
}
