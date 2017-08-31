"use strict";


let app = new Vue({
  el: '#app',
  data: {
    bots: serverSideSettingsList.bots,
    gdriveSettings: serverSideSettingsList.gdriveSettings,
    boxSettings: serverSideSettingsList.boxSettings,
    other: "Hello1",
    saveBotsBtnText: "Save and reload bots"
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
        app.saveBotsBtnText = "Save and reload bots";
      });
    },
    saveSettings: () => {
      console.log("Saving settings...");
      //app.saveBotsBtnText = "Saving";
      app.$http.post('/settings/api/save', { gdriveSettings: app.gdriveSettings, boxSettings: app.boxSettings }).then(response => {
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
        //app.saveBotsBtnText = "Save bots";
      });
    }
  }
});