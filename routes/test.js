"use strict";

let router = require('express').Router();
let ensureAuthenticated = require('./auth_middleware');
const databaseServices = require('../bot/database_services');
const googleDriveConfig = require('../bot/keys/sample-gdrive-settings.json');
let env = require('node-env-file');
env(__dirname + '/../bot/.env', {raise: false});

const STATUS_TYPES = require('../bot/status_types');
const json2csv = require('json2csv');
const fs = require('fs');

let gdrive_client_id = process.env.gdrive_client_id;
let gdrive_developer_key = process.env.gdrive_developer_key;
let gdrive_share_to = googleDriveConfig.client_email; //'spark-drive@testdriveintegration-167213.iam.gserviceaccount.com';

let bot = require('../app').bot;

if (!gdrive_client_id) {
  console.error("WARNING: gdrive_client_id is not defined!");
}
if (!gdrive_developer_key) {
  console.error("WARNING: gdrive_developer_key is not defined!");
}
if (!gdrive_share_to) {
  console.error("WARNING: gdrive_share_to is not defined!");
}

router.get('/', ensureAuthenticated, (req, res, next) => {
  res.render('test', {
    title: 'Onboarding Bot | manager test page',
    active: 'Search user', // left side bar icon
    gdrive_client_id: gdrive_client_id,
    gdrive_developer_key: gdrive_developer_key,
    gdrive_share_to: gdrive_share_to
  });
});

router.get('/users/:flow_id/:total', ensureAuthenticated, (req, res, next) => {

  let flow_id = req.params.flow_id;
  let total = req.params.total;
  let sort = req.query.sort;
  let page = req.query.page;
  let per_page = req.query.per_page;
  let filter = req.query.filter;

  //verificar o numero de ordenacoes
  let allSorts = sort.split(',');
  let orders = [];
  allSorts.forEach(function(currSort) {
    let order = "asc";
    let n = currSort.search(/asc$/);
    //desc
    if (n === -1) {
      order = "desc";
      n = currSort.search(/desc$/);
    }
    currSort = currSort.substring(0, n - 1);

    orders.push([currSort, order]);
  });

  if (typeof filter === 'undefined') {
    filter = "";
  } else {
    databaseServices.countUsers(flow_id, filter).then(result => {
      total = result;
    }, err => res.send(err));
  }

  databaseServices.getUsers(flow_id, page - 1, per_page, filter, orders).then(answers => {
    const dataJSON = createDataJSON(answers, flow_id, total, sort, page, per_page);
    console.log(dataJSON);
    res.send(dataJSON);
  }, err => res.send(err));
});

router.get('/answers/:flow_id/:resp_id', ensureAuthenticated, (req, res, next) => {
  databaseServices.getAnswers(req.params.flow_id, req.params.resp_id).then(answers => {
    const dataJSON = answers.map(answer => {
      let myanswer = formatAnswer(answer);
      return {
        question_num: answer.step.step_order,
        question: answer.step.text,
        answer: myanswer,
        answer_date: answer.answer_date.toUTCString(),
      }
    });
    console.log(dataJSON);
    res.send(dataJSON);
  }, err => res.send(err));
});

router.get('/export/:flow_id', ensureAuthenticated, (req, res, next) => {
  let fields = ['username', 'status', 'question_num', 'question', 'answer', 'answer_date'];
  databaseServices.totalAnswers(req.params.flow_id).then(answers => {

    let allAnswers = answers.map(answer => {
      return {
        username: answer.respondent_flow.respondent.name,
        status: answer.respondent_flow.respondent_flow_status.description,
        question_num: answer.step.step_order,
        question: answer.step.text,
        answer: formatAnswer(answer),
        answer_date: answer.answer_date.toUTCString(),
      }
    });

    let csv = json2csv({ data: allAnswers, fields: fields });
    let file = './public/file.csv';

    fs.writeFile(file, csv, function(err) {
      if (err) throw err;

      res.set('Content-disposition', 'attachment; filename=file.csv');
      res.set('Content-Type', 'text/csv');
      res.download('./public/file.csv', 'file.csv', function(error) {
        console.log(error);
      });

      //res.send(file);
    });
  }, err => res.send(err));
});

router.get('/document_stores', ensureAuthenticated, (req, res, next) => {
  databaseServices.getGoogleDriveCredentials(2, 1).then(models => {
    res.send(models);
  }, err => res.send(err));
});

function createDataJSON(answers, flow_id, total, sort, page, per_page) {

  let answersReceived = createUsersJSON(answers);
  let last_page = Math.ceil(total / per_page);
  let nextPageUrl = "";
  let prevPageUrl = "";
  let nextPage = page + 1;
  let prevPage = page - 1;

  if (nextPage <= last_page) {
    nextPageUrl = "../../../test/answers/" + flow_id + "/" + total + "?sort=" + sort + "&page=" + nextPage + "&per_page=" + per_page
  }
  if (prevPage >= 1) {
    prevPageUrl = "../../../test/answers/" + flow_id + "/" + total + "?sort=" + sort + "&page=" + prevPage + "&per_page=" + per_page
  }

  let to = 0;
  if (page === last_page)
    to = total - (page - 1) * per_page;
  else
    to = (page) * per_page;

  return {
    total: parseInt(total),
    per_page: parseInt(per_page),
    current_page: parseInt(page),
    last_page: parseInt(last_page),
    next_page_url: nextPageUrl,
    prev_page_url: prevPageUrl,
    data: answersReceived,
    from: (page - 1) * per_page + 1,
    to: to
  };
}

function createUsersJSON(users) {

  return users.map((user, index) => {

    let start = null;
    let end = null;

    if (user.start_date !== null)
      start = user.start_date.toUTCString();

    if (user.end_date !== null)
      end = user.end_date.toUTCString();

    if (user.start_date !== null && user.respondent_flow_status.id === 1) {
      start = null;
    }

    return {
      id: index,
      resp_id: user.id,
      username: user.respondent.name,
      status: user.respondent_flow_status.description,
      details: null,
      start_date: start,
      end_date: end,
    }

  });
}

function formatAnswer(answer) {
  //colocar a resposta de acordo com o que recebe
  let myanswer;
  let stepType = answer.step.step_type_id;

  if (stepType === STATUS_TYPES.STEP_TYPES.FREE_TEXT) {
    myanswer = answer.text;
  } else if (stepType === STATUS_TYPES.STEP_TYPES.MULTIPLE_CHOICE) {
    myanswer = answer.step_choice.choice_order + " : " + answer.step_choice.text;
  } else if (stepType === STATUS_TYPES.STEP_TYPES.UPLOAD_TO_BOT ||
    stepType === STATUS_TYPES.STEP_TYPES.DOWNLOAD_FROM_BOT_AND_UPLOAD_BACK) { //|| stepType === STATUS_TYPES.STEP_TYPES.DOWNLOAD_FROM_BOT
    myanswer = answer.document_view_url; //'https://drive.google.com/file/d/' + answer.document_url + '/view';
    //'Check your "' + answer.step.document_step.upload_dir_name +
    //'" shared folder to download the "' + answer.document_url + '" document.';
  }

  return myanswer;
}

module.exports = router;