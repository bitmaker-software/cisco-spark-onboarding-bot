"use strict";

const databaseServices = require('../database_services');
const fs = require('fs');
const request = require('request');
const STATUS_TYPES = require('../status_types');

//require google apis
const google = require('googleapis');


//
// Retrieve the file from Google Drive and send back to Spark user
//
let getDocument = (drive, fileId, callback) => {
  drive.files.get({
    'fileId': fileId,
    'fields': "id,mimeType,name"
  }, function (err, file) {
    console.log(`[Google Drive] getDriveDocument, file:`);
    console.log(file);
    let mimetype = file.mimeType;
    let parts = file.mimeType.split('google-apps');

    //google files => export
    if (parts.length > 1) {
      console.log(parts[1]);

      let mimetype;
      let extension;
      if (parts[1] === '.document') {
        mimetype = 'application/vnd.oasis.opendocument.text';
        extension = '.odt';
      } else if (parts[1] === '.spreadsheet') {
        mimetype = 'application/x-vnd.oasis.opendocument.spreadsheet';
        extension = '.ods';
      } else if (parts[1] === '.drawing') {
        mimetype = 'image/png';
        extension = '.png';
      } else if (parts[1] === '.presentation') {
        mimetype = 'application/vnd.oasis.opendocument.presentation';
        extension = '.odp';
      } else {
        mimetype = 'application/pdf';
        extension = '.pdf';
      }

      let filePath = "/tmp/" + file.name + extension;
      let dest = fs.createWriteStream(filePath);

      dest.on('open', function (fd) {
        drive.files.export({
          fileId: file.id,
          mimeType: mimetype
        }).on('end', function () {
          console.log('[Google Drive] Done');
          callback(fs.createReadStream(filePath));
        }).on('error', function (err) {
          console.log('[Google Drive] Error during download', err);
        }).pipe(dest);
      });
    }
    //download
    else {
      let filePath = "/tmp/" + file.name;
      let dest = fs.createWriteStream(filePath);

      dest.on('open', function (fd) {
        drive.files.get({
          fileId: fileId,
          alt: 'media'
        }).on('end', function () {
          console.log('[Google Drive] Download Done');
          callback(fs.createReadStream(filePath));
        }).on('error', function (err) {
          console.log('[Google Drive] Error during download', err);
        }).pipe(dest);
      });
    }
  });
};

//
// Uploads a file to gdrive
//
let upload = (drive, file_info, file, folderId, callback) => {

  const timeStamp = Math.floor(Date.now() / 1000);
  const name = timeStamp + file_info.filename.replace(/[\/\\]/g, '_');

  const fileMetadata = {
    'name': name,
    'parents': [folderId],
    'mimeType': file_info['content-type'],
  };

  const media = {
    'mimeType': file_info['content-type'],
    'body': file
  };

  drive.files.create({
    resource: fileMetadata,
    media: media,
    fields: 'id',
  }, function (err, file) {
    if (err) {
      console.log("[Google Drive] Error uploading file :");
      console.log(err);
    } else {

      let fileData = {
        id: file.id,
        webContentLink: 'https://drive.google.com/file/d/' + file.id + '/view'
      };

      callback(fileData);
    }
  });
};

//
// Retrieves the user store in order to build the drive object and execute the function
//
let buildDriveAndExecute = (store, callback) => {

  if (store.key_file === null || store.key_file === '') {
    console.error(`[Google Drive] No key file for this store`);
    return;
  }

  // Go get information about the store first
  //this is the json file with the private key
  // let key = require(store.key_file); // .json file
  let key = JSON.parse(store.key_file);

  // create an access token for read only access
  let jwtClient = new google.auth.JWT(
    key.client_email,
    null,
    key.private_key, ['https://www.googleapis.com/auth/drive'], //.readonly
    null
  );

  let drive = google.drive({
    version: 'v3',
    auth: jwtClient
  });

  // Pass the drive to the callback
  callback(drive);
};

//
// Public API
//
module.exports = {

  //
  // Downloads a document from google drive
  //
  getDriveDocument: (store, fileId, callback) => {
    console.log(`[Google Drive] Getting document with id: ${fileId}`);
    buildDriveAndExecute(store, (drive) => {
      // Download the file now
      getDocument(drive, fileId, callback);
    });
  },

  // 
  // Uploads a document to google drive
  //
  uploadToDrive: (store, file_info, file, folderId, callback) => {
    console.log(`[Google Drive] Uploading document to folder id: ${folderId}`);
    buildDriveAndExecute(store, (drive) => {
      // upload the file
      upload(drive, file_info, file, folderId, callback);
    });
  }

};