(function() {
  console.log('Box initializing');
  let self = {};
  window.Box = self;

  let scriptElement = document.getElementById("box");
  self.clientId = scriptElement.getAttribute("data-box-client-id");
  self.document_store_id = scriptElement.getAttribute("data-box-document-store-id");

  self.apiLoaded = false;

  self.selectMode = 'none';
  self.afterSelectionCallback = null;

  self.onApiLoaded = function() {
    console.log('Box main API loaded');

    var options = {
      clientId: self.clientId,
      linkType: 'shared',
      multiselect: 'false'
    };

    self.boxSelect = new BoxSelect(options);

    // Register a success callback handler
    self.boxSelect.success(function(response) {
      console.log(response);

      //share ok
      if (self.afterSelectionCallback && response.length > 0) {
        let item = response[0];
        console.log(item);
        if (self.selectMode === item.type) {
          self.afterSelectionCallback(item.id, item.name, self.document_store_id);
        } else {
          self.afterSelectionCallback('wrong', item.name);
        }

      }
      self.afterSelectionCallback = null;

    });

    // Register a cancel callback handler
    self.boxSelect.cancel(function() {
      console.log("The user clicked cancel or closed the popup");
    });
  };


  self.selectFile = function(callback) {
    self.afterSelectionCallback = callback;
    self.selectMode = 'file';
    self.boxSelect.launchPopup();
  };

  self.selectFolder = function(callback) {
    self.afterSelectionCallback = callback;
    self.selectMode = 'folder';
    self.boxSelect.launchPopup();
  };

}());