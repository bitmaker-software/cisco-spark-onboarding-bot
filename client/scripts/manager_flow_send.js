"use strict";

$(function () {
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
        $.get('/test/search_users/' + searchString, {}, res => {

          app.searchResultsInfo = `Found ${res.length} result(s).`;
          app.searchResults = res;

        }).fail(
          error => {
            if (error.status === 401) {
              window.location.replace('/auth/spark');
            }
          });
      },
      sendFlowToUser: user => {
        $.post('/test/send_flow/' + flowId + '/' + user.id, {}, res => {
          alert(res);
        }).fail(error => {
          if (error.status === 401) {
            window.location.replace('/auth/login');
          }
        });
      }
    },
  });
});
