"use strict";

let app = new Vue({
  el: '#root',
  // app initial state
  data: {
    searching: false,
    searchInput: '',
    searchResultsInfo: '',
    searchResults: [],
    flow: flowFromServer,
    peopleToMeetSteps: [],
    currentStep: 1, // 1: search user; 2: select people to meet
    currentUser: {},
  },
  methods: {
    addEmailToInput: event => {
      app.searchInput = event.currentTarget.innerText;
    },
    doSearch: () => {
      app.searching = true;
      app.searchResultsInfo = '';
      app.searchResults = [];
      const searchString = encodeURIComponent(app.searchInput);
      app.$http.get('/manager/api/search_users/' + searchString).then(response => {
        app.searchResultsInfo = `Found ${response.body.length} result${response.body.length === 1 ? '' : 's' }.`;
        app.searchResults = response.body;
        app.searching = false;
      }, error => {
        if (error.status === 401) {
          window.location.replace('/auth/spark');
        }
      });
    },
    sendFlowToUser: user => {
      app.$http.post('/manager/api/flow/' + flowId + '/send', {
        userId: user.id,
        peopleToMeet: app.peopleToMeetSteps.map(item => {
          return {
            stepId: item.stepId,
            list: item.list,
          };
        }),
      }).then(response => {
        swal({
          title: 'Sent!',
          type: 'success'
        });
        app.clearUserAndPeopleToMeet();
      }, error => {
        if (error.status === 401) {
          window.location.replace('/auth/login');
        } else if (error.status === 400) {
          // Bad request
          swal({
            title: 'Oops...',
            text: error.body,
            type: 'error'
          });
          app.clearUserAndPeopleToMeet();
        }
      });
    },

    showPeopleToMeetStep: user => {
      app.currentUser = user;
      app.currentStep = 2;
    },

    searchUserToMeet: item => {
      item.searching = true;
      item.searchResultsInfo = '';
      item.searchResults = [];
      const searchString = encodeURIComponent(item.searchInput);
      console.log(this);
      app.$http.get('/manager/api/search_users/' + searchString).then(response => {
        item.searchResultsInfo = `Found ${response.body.length} result${response.body.length === 1 ? '' : 's' }.`;
        item.searchResults = response.body;
        item.searching = false;
      }, error => {
        if (error.status === 401) {
          window.location.replace('/auth/spark');
        }
      });
    },
    addPersonToPeopleToMeet: (person, list) => list.push(person),
    removePersonFromPeopleToMeet: (person, list) => list.splice(list.indexOf(person), 1),

    clearUserAndPeopleToMeet: () => {
      app.searchInput = '';
      app.searchResultsInfo = '';
      app.searchResults = [];
      app.peopleToMeetSteps.forEach(step => {
        step.list = [];
        step.searchInput = '';
        step.searching = false;
        step.searchResultsInfo = '';
        step.searchResults = [];
      });
      app.currentStep = 1;
      app.currentUser = {};
    }
  },
  mounted() {
    this.flow.steps.forEach(step => {
      console.log(`this.flow.steps.forEach step:`);
      console.log(step);
      if (step.step_type_id === 7) {
        // People to meet
        this.peopleToMeetSteps.push({
          stepText: step.text,
          stepId: step.id,
          list: [],
          showSearch: false,
          searchInput: '',
          searching: false,
          searchResultsInfo: '',
          searchResults: [],
        });
      }
    });
  }
});
