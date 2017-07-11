"use strict";

let router = require('express').Router();
let ensureAuthenticated = require('./auth_middleware');
const databaseServices = require('../bot/database_services');
let env = require('node-env-file');
env(__dirname + '/../bot/.env');

let gdrive_client_id = process.env.gdrive_client_id;
let gdrive_developer_key = process.env.gdrive_developer_key;
let gdrive_share_to = 'spark-drive@testdriveintegration-167213.iam.gserviceaccount.com';

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
    title: 'Onboarding manager test page',
    active: 'Search user', // left side bar icon
    gdrive_client_id: gdrive_client_id,
    gdrive_developer_key: gdrive_developer_key,
    gdrive_share_to: gdrive_share_to
  });
});

router.get('/answers/:flow_id/:total', ensureAuthenticated, (req, res, next) => {

  let flow_id = req.params.flow_id;
  let total = req.params.total;
  let sort = req.query.sort;
  let page = req.query.page;
  let per_page = req.query.per_page;
  let filter = req.query.filter;
  let order = "asc";

  //default
  if (sort === "") {
    sort = "id";
  }
  else {
    let n = sort.search('asc');
    //desc
    if (n === -1) {
      order = "desc";
      n = sort.search('desc');
    }

    sort = sort.substring(0, n - 1);
  }

  if (typeof filter === 'undefined') filter = "";
  else {
    databaseServices.countAnswers(flow_id, filter).then(result => {
      total = result;
    }, err => res.send(err));
  }
  databaseServices.getAnswers(flow_id,page-1,per_page,filter,sort,order).then(answers => {
    var dataJSON = createJSON(answers,flow_id,total,sort,page,per_page);
      console.log(dataJSON)
    res.send(dataJSON);
  }, err => res.send(err));
});

router.get('/document_stores', ensureAuthenticated, (req, res, next) => {
  databaseServices.getGoogleDriveCredentials(2, 1).then(models => {
    res.send(models);
  }, err => res.send(err));
});

function createJSON(answers, flow_id, total, sort, page, per_page) {
    let answersReceived = answers.map(answer => {
        //colocar a resposta de acordo com o que recebe
        let myanswer;
        let stepType = answer.step.step_type_id;
        if (stepType === 2) {
            myanswer = answer.text;
        } else if (stepType === 3) {
            myanswer = answer.step_choice.choice_order + " : " + answer.step_choice.text;
        } else if (stepType === 4 || stepType === 5 || stepType === 6) {
            myanswer = answer.document_url;
        }

        let date = answer.answer_date;
        let month = date.getUTCMonth() + 1;

        console.log(stepType + " - " + myanswer);

        return {
            username: answer.respondent_flow.respondent.name,
            date: date.getUTCDate() + "-" + month + "-" + date.getUTCFullYear(),
            question_num: answer.step.step_order,
            question: answer.step.text,
            answer: myanswer
        }

    });

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
        to = (page) * per_page

    let dataJSON = {
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

    return dataJSON;
}

module.exports = router;