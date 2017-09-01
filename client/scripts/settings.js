"use strict";


let app = new Vue({
  el: '#app',
  data: {
    bots: serverSideSettingsList.bots,
    gdriveSettings: serverSideSettingsList.gdriveSettings,
    boxSettings: serverSideSettingsList.boxSettings,
    formData: new FormData(),
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

      app.formData.set('gdriveSettings', JSON.stringify(app.gdriveSettings));
      app.formData.set('boxSettings', JSON.stringify(app.boxSettings));

      app.$http.post('/settings/api/save', app.formData).then(response => {
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
    },


    bindFileGdrive: e => {
      app.formData.set('file-gdrive', e.target.files[0]);
    },
    bindFileBox: e => {
      app.formData.set('file-box', e.target.files[0]);
    },

  }
});