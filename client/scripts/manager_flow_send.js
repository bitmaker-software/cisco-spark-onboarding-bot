"use strict";

let app = new Vue({
  el: '#root',
  // app initial state
  data: {
    searchInput: '',
    searchResultsInfo: '',
    searchResults: []
  },
  methods: {
    addEmailToInput: address => {
      app.searchInput = event.currentTarget.innerText;
    },
    doSearch: () => {
      const searchString = encodeURIComponent(app.searchInput);
      console.log(this);
      app.$http.get('/test/search_users/' + searchString).then(response => {
        app.searchResultsInfo = `Found ${response.body.length} result(s).`;
        app.searchResults = response.body;
      }, error => {
        if (error.status === 401) {
          window.location.replace('/auth/spark');
        }
      });
    },
    sendFlowToUser: user => {
      app.$http.post('/test/send_flow/' + flowId + '/', {userId: user.id}).then(response => {
        alert(response.body);
      }, error => {
        if (error.status === 401) {
          window.location.replace('/auth/login');
        } else if (error.status === 400) {
          // Bad request. Does the user exist?
          swal({
            title: 'Oops...',
            text: error.body,
            type: 'error'
          })
        }
      });
    }
  },
});
