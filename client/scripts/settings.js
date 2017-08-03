"use strict";


let app = new Vue({
  el: '#app',
  data: {
    bots: serverSideSettingsList.bots,
    other: "Hello1",
    saveBotsBtnText: "Save bots"
  },
  methods: {
    addBot: () => {
      app.bots.push({
        name: undefined,
        access_token: undefined,
        public_https_address: undefined,
        webhook_name: undefined,
        secret: undefined
      });
    },
    saveBots: () => {
      app.saveBotsBtnText = "Saving";
      app.$http.post('/settings/api/saveBots', app.bots).then(response => {
        // success callback
        swal({
          title: 'Saved',
          type: 'success'
        });
      }, error => {
        // error callback
        swal({
          title: 'Oops...',
          text: error.body,
          type: 'error'
        })
      }).finally(() => {
        app.saveBotsBtnText = "Save bots";
      });
    }
  }
});