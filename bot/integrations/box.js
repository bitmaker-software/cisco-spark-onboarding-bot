"use strict";

const databaseServices = require('../database_services');
const fs = require('fs');
var BoxSDK = require('box-node-sdk');

//
// Retrieve the file from gdrive
//
let getDocument = (client, fileId, callback) => {

  console.log(`Getting file with id ${fileId}`);

  client.files.get(fileId, { fields: 'name' }, (err, data) => {

    console.log('Going to get file info...');

    if (err !== null) {
      console.log(`Error trying to grab information about file id ${fileId}`);
    } else {

      // Download the file
      client.files.getReadStream(fileId, null, function(error, stream) {

        if (error) {
          // handle error
          console.log("Error downloading file");
        } else {

          console.log(`Downloading file ${data.name}`);

          let filePath = "./bot/files_to_serve/" + data.name;
          let dest = fs.createWriteStream(filePath);

          // After all data is saved, read them back to the callback
          stream.on('end', () => {
            callback(fs.createReadStream(filePath));
          });

          // Check for errors saving the stream
          dest.on('error', (err) => {
            console.log('We were unable to save the file:');
            console.log(err);
          });

          // pipen the destination on the stream
          stream.pipe(dest);
        }

      });
    }
  });

};

//
// Uploads a file to box
//
let upload = (client, file_info, file, folderId, callback) => {

  const timeStamp = Math.floor(Date.now() / 1000);
  const name = timeStamp + file_info.filename.replace(/[\/\\]/g, '_');
  //console.log(`Wil upload file: `);
  //console.log(file);
  //var stream = fs.createReadStream(file);
  console.log(`Uploading file ${name} to box`);
  client.files.uploadFile(folderId, name, file, (err, uploadInfo) => {
    if (err !== null) {
      console.log('Error uploading file');
      console.log(err);
    } else {

      console.log(`Uploading file ${name} done! Generating link...`);

      let file = {
        id: uploadInfo.entries[0].id,
        webContentLink: ''
      };

      // Let's create a shareable link to allow us to open the file afterwards
      client.files.update(file.id, { shared_link: client.accessLevels.DEFAULT }, (err, response) => {
        if (err !== null) {
          console.log('Error uploading file');
          console.log(err);
        } else {
          console.log(`Link to file ${name} done! Calling back...`);
          file.webContentLink = response.shared_link.url;
          callback(file);
        }
      });
    }
  });

};

let callAsUser = (client, clientId, callback) => {

  // Impersonate the user that owns the account
  console.log(`Going to impersonate user ${clientId}`);
  client.asUser(clientId);

  // Pass the client to the callback
  callback(client);
};

//
// Retrieves the user store in order to build the drive object and execute the function
//
let buildDriveAndExecute = (store, callback) => {

  // Go get information about the store first
  if (store.server_config_file !== null) {

    console.log(`Using server config file: ${store.server_config_file }`);

    //this is the json file with the private key
    let key = require(store.server_config_file);

    // create an access token for read only access
    let sdk = new BoxSDK({
      clientID: key.boxAppSettings.clientID,
      clientSecret: key.boxAppSettings.clientSecret,
      appAuth: {
        keyID: key.boxAppSettings.appAuth.publicKeyID,
        privateKey: key.boxAppSettings.appAuth.privateKey,
        passphrase: key.boxAppSettings.appAuth.passphrase
      }
    });

    // Get the service account client, used to create and manage app user accounts
    let client = sdk.getAppAuthClient('enterprise', key.enterpriseID);

    // Let's check if we already have the user
    let clientId = store.box_user_id;
    console.log(`Going to use clientId: ${clientId}`);
    if (clientId === null) {
      console.log('Getting clientId');
      // Get the user and impersonate
      client.enterprise.getUsers(null, (error, data) => {
        if (error !== null) {
          console.log(error);
        } else {
          console.log(`Trying to get user account for ${store.box_user_account}`);
          let user = data.entries.find(match => match.login === store.box_user_account);
          if (typeof user !== 'undefined' && user !== null) {
            // update the database for the next time
            console.log(`Updating user id for user ${store.box_user_account}: ${user.id}`);
            databaseServices.updateDocumentStoreUserId(store.id, user.id);
            clientId = user.id;

            // Pass the client to the callback
            callAsUser(client, clientId, callback);
          } else {
            console.log(`Unable to find user wuth email ${store.box_user_account}`);
          }
        }
      });
    } else {
      // Pass the client to the callback
      callAsUser(client, clientId, callback);
    }

  } else {
    console.log("Missing server config file");
  }
};

//
// Public API
//
module.exports = {

  //
  // Downloads a document from google drive
  //
  getDriveDocument: (store, fileId, callback) => {
    console.log(`Getting document with id: ${fileId}`);
    buildDriveAndExecute(store, (client) => {
      // Download the file now
      getDocument(client, fileId, callback);
    });
  },

  // 
  // Uploads a document to google drive
  //
  uploadToDrive: (store, file_info, file, folderId, callback) => {
    console.log(`Uploading document to folder id: ${folderId}`);
    buildDriveAndExecute(store, (client) => {
      // upload the file
      upload(client, file_info, file, folderId, callback);
    });
  }

};