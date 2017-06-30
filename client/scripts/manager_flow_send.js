"use strict";

let app = new Vue({
  el: '#root',
  // app initial state
  data: {
    searching: false,
    searchInput: '',
    searchResultsInfo: '',
    searchResults: []
  },
  methods: {
    addEmailToInput: address => {
      app.searchInput = event.currentTarget.innerText;
    },
    doSearch: () => {
      app.searching = true;
      app.searchResultsInfo = '';
      app.searchResults = [];
      const searchString = encodeURIComponent(app.searchInput);
      console.log(this);
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
      app.$http.post('/manager/api/flow/' + flowId + '/send', {userId: user.id}).then(response => {
        swal({
          title: 'Sent!',
          type: 'success'
        })
      }, error => {
        if (error.status === 401) {
          window.location.replace('/auth/login');
        } else if (error.status === 400) {
          // Bad request
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
