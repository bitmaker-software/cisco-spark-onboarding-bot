module.exports = {
  ANSWER_STATUS: {
    // Must be the same as defined on fixtures/1_answer_status.js
    WAITING: 1,
    ANSWERED: 2,
  },

  FLOW_STATUS: {
    // Must be the same as defined on fixtures/1_flow_status.js
    EDITING: 1,
    ACTIVE: 2,
    INACTIVE: 3,
  },

  RESPONDENT_FLOW_STATUS: {
    // Must be the same as defined on fixtures/1_respondent_flow_status.js
    NOT_STARTED: 1,
    IN_PROGRESS: 2,
    FINISHED: 3,
  },

  STEP_TYPES: {
    // Must be the same as defined on fixtures/1_step_type.js
    ANNOUNCEMENT: 1,
    FREE_TEXT: 2,
    MULTIPLE_CHOICE: 3,
    UPLOAD_TO_BOT: 4,
    DOWNLOAD_FROM_BOT: 5,
    DOWNLOAD_FROM_BOT_AND_UPLOAD_BACK: 6,
    PEOPLE_TO_MEET: 7,
  },
};