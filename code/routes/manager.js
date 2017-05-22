var models = require('../models');
var express = require('express');
var router = express.Router();

/* GET manager. */
router.get('/', function (req, res, next) {
  res.render('manager', {
    title: 'Onboarding manager',
    flows: getFlows(),
    stepTypes: getStepTypes()
  });
});

function getFlows() {
  // Returns flows for the logged in tenant
  // TODO

  // Dummy data
  return [
    {id: 0, name: 'First flow', status: 'The status'},
    {id: 1, name: 'Second flow', status: 'The status'},
    {id: 2, name: 'Third flow', status: 'The status'},
    {id: 3, name: 'Fourth flow', status: 'The status'}
  ];
}

function getStepTypes() {
  // Returns step types
  // TODO

  // Dummy data
  return [
    {
      id: 0,
      description: 'Announcement Message (no response from the user to move the next step)'
    },
    {
      id: 1,
      description: 'Question Step (owner must enter a question and the confirmation word that the user must enter to move on in the Flow)'
    },
    {
      id: 2,
      description: 'Document Step (owner specifies some instructions and the end user must upload a document to complete the step)'
    },
    {
      id: 3,
      description: 'Multiple Choice Step (owner specifies a list of possible options, end user replies with 1,2,3 or 4 etc)'
    },
    {
      id: 4,
      description: 'Docusign Step (owner specifies a document which will trigger a document to be sent to Docusign for the end user to digitally sign)'
    }
  ];
}

router.post('/api/saveToken', function (req, res, next) {
  var token = req.body.token;
  if (token) {
    models.tenant.create({
      name: 'auto',
      botKey: req.body.token
    }).then(function () {
      res.send('OK, saved token ' + token);
    });
  } else {
    res.send('No token provided')
  }
});

router.get('/api/flow/:id', function (req, res, next) {
  // Returns the flow steps
  // TODO

  // Dummy data
  res.send({
    flow_id: req.params.id,
    steps: [
      {id: '0', step_order: '1', text: 'Step number one', step_type: 0},
      {id: '1', step_order: '2', text: 'Step number two', step_type: 1},
      {id: '2', step_order: '3', text: 'Step number three', step_type: 0},
      {id: '3', step_order: '4', text: 'Step number four', step_type: 2},
      {id: '4', step_order: '5', text: 'Step number five', step_type: 1},
      {id: '5', step_order: '6', text: 'Step number six', step_type: 3},
      {id: '6', step_order: '7', text: 'Step number seven', step_type: 4}
    ]
  });
});

router.get('/api/flows', function (req, res, next) {
  res.send(['first flow', 'second flow', 'third flow', 'fourth flow']);
});

module.exports = router;