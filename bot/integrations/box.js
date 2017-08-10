"use strict";

const databaseServices = require('../database_services');
const fs = require('fs');
const request = require('request');
const STATUS_TYPES = require('../status_types');

//require google apis
const google = require('googleapis');

//this is the json file with the private key
const key = require('../keys/Integration test-6661fdb0c0a7.json');


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

//authorize a request
//jwtClient.authorize(function(err, tokens) {
//  if (err) {
//    console.log(err);
//    return;
//  }

// Make an authorized request to list Drive files.
// drive.files.list({
//   folderId: '0B-65Xatz4HOrc25Gc2lrY2lPZW8', // TODO: André: where does this ID come from?
//   auth: jwtClient
// }, (err, response) => {
//   if (err) {
//     console.log('drive.files.list() error: ' + err);
//     return;
//   }
//   let files = response.files;
//   if (files.length === 0) {
//     console.log('drive.files.list(): no files found.');
//   } else {
//     console.log('List of files on Google Drive:');
//     console.log(`  ----------------------------------------`);
//     for (let i = 0; i < files.length; i++) {
//       let file = files[i];
//       console.log(`          ${file.id} → ${file.name}`);
//       /*
//                //delete files
//                drive.files.delete({
//                fileId: file.id
//                }, function (err, response) {
//                if (err) {
//                console.log('delete error: ' + err);
//                return;
//                }
//                console.log("deleted "+file.id);
//                });
//       */
//     }
//     console.log(`  ----------------------------------------`);
//   }
// });
//});


module.exports = {

  //
  // Retrieve the file from gdrive
  //
  getDriveDocument: (fileId, callback) => {
    drive.files.get({
      'fileId': fileId,
      'fields': "id,mimeType,name"
    }, function(err, file) {
      console.log(`getDriveDocument, file:`);
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

        let filePath = "./bot/files_to_serve/" + file.name + extension;
        let dest = fs.createWriteStream(filePath);

        dest.on('open', function(fd) {
          drive.files.export({
            fileId: file.id,
            mimeType: mimetype
          }).on('end', function() {
            console.log('Done');
            callback(fs.createReadStream(filePath));
          }).on('error', function(err) {
            console.log('Error during download', err);
          }).pipe(dest);
        });
      }
      //download
      else {
        let filePath = "./bot/files_to_serve/" + file.name;
        let dest = fs.createWriteStream(filePath);

        dest.on('open', function(fd) {
          drive.files.get({
            fileId: fileId,
            alt: 'media'
          }).on('end', function() {
            console.log('Download Done');
            callback(fs.createReadStream(filePath));
          }).on('error', function(err) {
            console.log('Error during download', err);
          }).pipe(dest);
        });
      }
    });
  },

  //
  // Uploads a file to gdrive
  //
  uploadToDrive: (file_info, file, folderId, callback) => {

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
    }, function(err, file) {
      if (err) {
        console.log("Error uploading file :");
        console.log(err);
      } else {
        callback(file);
      }
    });
  }
}