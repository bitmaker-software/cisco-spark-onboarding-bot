"use strict";

let express = require('express');
let request = require('request');
let router = express.Router();
let ensureAuthenticated = require('./auth_middleware');
let database_services = require('../bot/database_services');
let env = require('node-env-file');
env(__dirname + '/../bot/.env');

let gdrive_client_id = process.env.gdrive_client_id;
let gdrive_developer_key = process.env.gdrive_developer_key;
let gdrive_share_to = 'spark-drive@testdriveintegration-167213.iam.gserviceaccount.com';

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

router.get('/search_users/:user', ensureAuthenticated, (req, res, next) => {
  request({
    url: 'https://api.ciscospark.com/v1/people',
    qs: {
      email: req.params.user
    },
    auth: {
      user: null,
      pass: null,
      bearer: req.user.spark_token
    }
  }, (error, response, body) => {
    if (!error && response.statusCode == 200) {
      var json = JSON.parse(body);
      var users = json.items.map(item => {
        var email = '';
        if (item.emails && item.emails.length > 0) {
          email = item.emails[0];
        }
        return {
          id: item.id,
          displayName: item.displayName,
          email: email
        };
      });
      res.send(users);
    } else {
      res.send([]);
    }
  });
});

router.post('/send_flow/:flow_id', ensureAuthenticated, (req, res, next) => {

  // Initiate the flow for this user
  const userId = req.body.userId;

  if (userId) {
    return res.status(400).send("No user ID provided!");
  } else {
    return res.status(200).send();
  }

  request({
    url: 'https://api.ciscospark.com/v1/messages',
    method: 'POST',
    auth: {
      user: null,
      pass: null,
      bearer: process.env.access_token
    },
    json: true,
    body: {toPersonId: req.params.spark_id, text: 'Hello. I am the onboarding bot!'}
  }, (error, response, body) => {
    if (!error && response.statusCode === 200) {
      res.send("flow sent!")
    } else {
      res.send("flow not sent: " + error)
    }
  });
});

router.get('/answers/:flow_id/:total', ensureAuthenticated, (req, res, next) => {

  var flow_id = req.params.flow_id;
  var total = req.params.total;
  var sort = req.query.sort;
  var page = req.query.page;
  var per_page = req.query.per_page;
  var filter = req.query.filter;
  var order = "asc";

  //default
  if(sort === ""){
      sort = "id";
  }
  else{
      var n = sort.search('asc');
      //desc
      if(n === -1) {
          order = "desc";
          n = sort.search('desc');
      }

      sort = sort.substring(0,n-1);
  }

  console.log(sort+ " "+ order);
  console.log("\n\n");

  if(typeof filter === 'undefined') filter = "";
  else{
    database_services.countAnswers(flow_id,filter).then(result => {
      total = result;
    }, err => res.send(err));
  }

  database_services.getAnswers(flow_id,page-1,per_page,filter,sort,order).then(answers => {
    var dataJSON = createJSON(answers,flow_id,total,sort,page,per_page);
    res.send(dataJSON);
  }, err => res.send(err));

});

router.get('/document_stores', ensureAuthenticated, (req, res, next) => {
  database_services.getGoogleDriveCredentials(2, 1).then(models => {
    res.send(models);
  }, err => res.send(err));
});


function createJSON(answers,flow_id,total,sort,page,per_page)
{
    var answersReceived = answers.map(answer => {
        //colocar a resposta de acordo com o que recebe
        var myanswer;
        var stepType = answer.step.step_type_id;
        if (stepType == 2) myanswer = answer.text;
        else if (stepType == 3) myanswer = answer.document_url;
        else if (stepType == 4) myanswer = answer.step_choice.choice_order + " : " + answer.step_choice.text;

        var date = answer.answer_date;
        var month = date.getUTCMonth()+1;

        return {
            username: answer.respondent_flow.respondent.name,
            date: date.getUTCDate()+"-"+month+"-"+date.getUTCFullYear(),
            question_num: answer.step.step_order,
            question: answer.step.text,
            answer: myanswer
        }
    });

    var last_page = Math.ceil(total/per_page);
    var nextPageUrl = "";
    var prevPageUrl = "";
    var nextPage = page+1;
    var prevPage = page-1;

    if(nextPage <= last_page){
        nextPageUrl = "../../../test/answers/"+flow_id+"/"+total+"?sort="+sort+"&page="+nextPage+"&per_page="+per_page
    }
    if(prevPage >= 1){
        prevPageUrl = "../../../test/answers/"+flow_id+"/"+total+"?sort="+sort+"&page="+prevPage+"&per_page="+per_page
    }

    var to = 0;
    if(page == last_page)
        to = total-(page-1)*per_page;
    else
        to = (page)*per_page

    var dataJSON = {
        total: parseInt(total),
        per_page: parseInt(per_page),
        current_page: parseInt(page),
        last_page: parseInt(last_page),
        next_page_url:nextPageUrl,
        prev_page_url:prevPageUrl,
        data: answersReceived,
        from: (page-1)*per_page+1,
        to: to
    };

    return dataJSON;
}

module.exports = router;