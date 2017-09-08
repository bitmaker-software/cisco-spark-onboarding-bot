"use strict";

const databaseServices = require('../database_services');
const gdrive = require('./gdrive.js');
const box = require('./box.js');


//
// Retrieves the user store in order to build the drive object and execute the function
//
let buildDriveAndExecute = (documentStoreId, callback) => {
  // Go get information about the store first
  databaseServices.getDocumentStoreById(documentStoreId, 1).then((store) => {

    // Act based on the store type
    if (store.document_store_type_id === 1) {
      console.log(`Using Google Drive`);
      callback(gdrive, store);
    } else if (store.document_store_type_id === 2) {
      console.log(`Using Box`);
      callback(box, store);
    }

  });
};

//
// Public API
//
module.exports = {

  //
  // Downloads a document from google drive
  //
  getDriveDocument: (documentStoreId, fileId, callback) => {
    buildDriveAndExecute(documentStoreId, (driveToUse, store) => {
      // Download the file now
      driveToUse.getDriveDocument(store, fileId, callback);
    });
  },

  // 
  // Uploads a document to google drive
  //
  uploadToDrive: (documentStoreId, file_info, file, folderId, callback) => {

    buildDriveAndExecute(documentStoreId, (driveToUse, store) => {
      // upload the file
      driveToUse.uploadToDrive(store, file_info, file, folderId, callback);
    });
  }

};