"use strict";

const databaseServices = require('../database_services');
const fs = require('fs');
const BoxSDK = require('box-node-sdk');

//
// Retrieve the file from Box
//
let getDocument = (client, fileId, callback) => {

  console.log(`[Box] Getting file with id ${fileId}`);

  client.files.get(fileId, {fields: 'name'}, (err, data) => {

    console.log('[Box] Going to get file info...');

    if (err !== null) {
      console.error(`[Box] Error trying to grab information about file id ${fileId}`);
      console.error(err);
    } else {

      // Download the file from Box and send back to Spark user
      client.files.getReadStream(fileId, null, function (error, stream) {

        if (error) {
          // handle error
          console.log("[Box] Error downloading file");
        } else {

          console.log(`[Box] Downloading file ${data.name}`);

          let filePath = "/tmp/" + data.name;
          let dest = fs.createWriteStream(filePath);

          // After all data is saved, save to the database and read it back to the callback
          stream.on('end', () => {
            callback(fs.createReadStream(filePath));
          });

          // Check for errors saving the stream
          dest.on('error', (err) => {
            console.log('[Box] We were unable to save the file:');
            console.log(err);
          });

          // pipe the destination on the stream
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
  //let stream = fs.createReadStream(file);
  console.log(`[Box] Uploading file ${name} to box`);
  client.files.uploadFile(folderId, name, file, (err, uploadInfo) => {
    if (err !== null) {
      console.log('[Box] Error uploading file');
      console.log(err);
    } else {

      console.log(`[Box] Uploading file ${name} done! Generating link...`);

      let file = {
        id: uploadInfo.entries[0].id,
        webContentLink: ''
      };

      // Let's create a shareable link to allow us to open the file afterwards
      client.files.update(file.id, {shared_link: client.accessLevels.DEFAULT}, (err, response) => {
        if (err !== null) {
          console.log('[Box] Error uploading file');
          console.log(err);
        } else {
          console.log(`[Box] Link to file ${name} done! Calling back...`);
          file.webContentLink = response.shared_link.url;
          callback(file);
        }
      });
    }
  });

};

//
// Retrieves the user store in order to build the drive object and execute the function
//
let buildDriveAndExecute = (store, callback) => {

  if (store.key_file === null || store.key_file === '') {
    console.error(`[Box] No key file for this store`);
    return;
  }

  // console.log(`Using key file: ${store.key_file}`);

  // Go get information about the store first
  //this is the json file with the private key
  // let key = require(store.key_file); // .json file
  let key = JSON.parse(store.key_file);

  // create an access token for read only access
  let sdkConfig = {
    clientID: key.boxAppSettings.clientID,
    clientSecret: key.boxAppSettings.clientSecret,
    appAuth: {
      keyID: key.boxAppSettings.appAuth.publicKeyID,
      privateKey: key.boxAppSettings.appAuth.privateKey,
      passphrase: key.boxAppSettings.appAuth.passphrase
    }
  };
  // console.log(`Box SDK config:`);
  // console.log(sdkConfig);
  let sdk = new BoxSDK(sdkConfig);

  // Get the service account client, used to create and manage app user accounts
  callback(sdk.getAppAuthClient('user', store.box_user_id));
};

//
// Public API
//
module.exports = {

  //
  // Downloads a document from Box
  //
  getDriveDocument: (store, fileId, callback) => {
    console.log(`[Box] Getting document with id: ${fileId}`);
    buildDriveAndExecute(store, client => {
      // Download the file now
      getDocument(client, fileId, callback);
    });
  },

  // 
  // Uploads a document to Box
  //
  uploadToDrive: (store, file_info, file, folderId, callback) => {
    console.log(`[Box] Uploading document to folder id: ${folderId}`);
    buildDriveAndExecute(store, client => {
      // upload the file
      upload(client, file_info, file, folderId, callback);
    });
  }

};