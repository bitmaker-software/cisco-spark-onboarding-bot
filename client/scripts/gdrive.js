function GDriver(clientId, developerKey, shareTo) {
    var self = this;
    console.log('initializing GDriver');
    self.clientId = clientId;
    self.developerKey = developerKey;
    self.shareTo = shareTo;

    self.oauthToken;

    self.apiLoaded = false;
    self.authApiLoaded = false;
    self.pickerApiLoaded = false;
    self.clientApiLoaded = false;
    self.driveShareLoaded = false;

    self.selectMode = 'none';
    self.afterSelectionCallback = null;

    self.onApiLoaded = function() {
        console.log('main API loaded')
        //load sub-components
        gapi.load('auth', {'callback': self.onAuthApiLoaded});
        gapi.load('picker', {'callback': self.onPickerApiLoad});
        gapi.load('client', {'callback': self.onClientApiLoad});
        //gapi.load('drive-share', {'callback': self.onDriveShareLoaded});
    };

    /**
     * Auth API was loaded
     */
    self.onAuthApiLoaded = function() {
        console.log('Auth api loaded');
        self.authApiLoaded = true;
    };

    self.askForUserAuthorization = function() {
        if(self.authApiLoaded) {
            //call the authorization method
            window.gapi.auth.authorize({
                'client_id': self.clientId,
                'scope': ['https://www.googleapis.com/auth/drive'],
                'immediate': false
            }, self.handleAuthResult);
        }else{
            console.log('auth api not loaded!');
            alert('Failed to load auth api');
        }
    }

    /**
     * handle the authentication result. Save the access token for next requests
     * @param authResult
     */
    self.handleAuthResult = function(authResult) {
        if (authResult && !authResult.error) {
            self.oauthToken = authResult.access_token;
            //check if we are selecting a file, should call createPicker
            if(self.selectMode !== 'none'){
                self.createPicker();
            }
        }
    };

    self.onPickerApiLoad = function() {
        self.pickerApiLoaded = true;
        console.log('Picker api loaded');
    };

    self.onClientApiLoad = function() {
        self.clientApiLoaded = true;
        console.log('client api loaded');
        gapi.client.load('drive', 'v3', self.onDriveShareLoaded);
    };

    self.onDriveShareLoaded = function() {
        self.driveShareLoaded = true;
        console.log('Drive share api loaded');
    }

    self.createPicker = function() {
        if(!self.oauthToken){
            console.log("haven't a oauth token yet, start oauth workflow")
            //user authorization wasn't asked yet
            self.askForUserAuthorization();
        }else{
            //we already have the token, check if picker api is loaded
            if(!self.pickerApiLoaded){
                console.log("picker api not loaded!");
                self.selectMode = 'none';
                alert("failed to load picker api");
            }else{
                //all preconditions are met, show the picker
                var view = new google.picker.DocsView(google.picker.ViewId.DOCS);
                view.setIncludeFolders(true);

                if(self.selectMode === 'folder'){
                    view.setMimeTypes('application/vnd.google-apps.folder');
                    view.setSelectFolderEnabled(true);
                }

                var picker = new google.picker.PickerBuilder().
                    addView(view).
                    setOAuthToken(self.oauthToken).
                    setDeveloperKey(self.developerKey).
                    setCallback(self.pickerCallback).
                    build();
                picker.setVisible(true);
            }
        }

    };

    self.pickerCallback = function(data){
        var url = 'nothing';
        var docid = '';
        if (data[google.picker.Response.ACTION] === google.picker.Action.PICKED) {
            var doc = data[google.picker.Response.DOCUMENTS][0];
            url = doc[google.picker.Document.URL];
            docid = doc[google.picker.Document.ID];
            self.shareFile(docid);
        } else if(data[google.picker.Response.ACTION] === google.picker.Action.CANCEL) {
            self.selectMode = 'none';
        }
        var message = 'You picked: ' + url + ' (' + docid + ')';
        console.log(message);
    };

    self.shareFile = function(fileId){
        if(self.driveShareLoaded) {
            var role = self.selectMode === 'file' ? 'reader' : 'writer';
            var req = gapi.client.drive.permissions.create({
                'fileId': fileId,
                'sendNotificationEmail': false,
                'resource': {
                    'emailAddress': shareTo,
                    'type': 'user',
                    'role': role
                }
            });

            req.execute(function (resp) {
                console.log(resp);
                if(resp.kind && resp.kind === 'drive#permission'){
                    //share ok
                    self.afterSelectionCallback(fileId);
                }
                self.selectMode = 'none';
                self.afterSelectionCallback = null;
            });
        }else{
            alert('Drive share api not loaded!');
            self.selectMode = 'none';
        }
    };

    self.selectFile = function(callback) {
        self.afterSelectionCallback = callback;
        self.selectMode = 'file';
        self.createPicker();
    };

    self.selectFolder = function(callback) {
        self.afterSelectionCallback = callback;
        self.selectMode = 'folder';
        self.createPicker();
    };
}
