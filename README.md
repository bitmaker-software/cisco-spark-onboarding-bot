# README #

This project uses BotKit


### What is this repository for? ###

* Cisco Onboarding Bot by Bitmaker


### How do I get set up? ###

* (optional) download https://www.postgresql.org/ftp/pgadmin to manage the database (next point)
* Create the database (e.g. ciscosparkonboarding) and the user (e.g. ciscosparkbot)

* npm install / yarn (to install the dependencies)
* Expose the bot localhost endpoint (_ngrok http 3000_) _[warning: Ubuntu's ngrok package is version 1.x and is not working]_ and copy the https:// address to the .env file **public_address** variable (next point)
* Go to https://developer.ciscospark.com and create a Cisco Spark App Integration in order to configure oAuth authentication
* Create the .env file on the bot dir (_/bot/.env_) with the Cisco Spark App information plus the database connection settings (use the .env.template file as model)
* Go to app.js (line 47) and change the CREATE_DB_AND_LOAD_FIXTURES variable to 'true' in order to create the management database.
* npm run dev (to have the development server running)
* Access http://localhost:3000 and login by using your cisco Spark credentials
* You might want to stop the server, change the CREATE_DB_AND_LOAD_FIXTURES variable to 'false' and restart the server again (thus the database won't get recreated every time you startup the server)


### Bot configuration ###

* After login access the settings page and add a new bot configuration
* Fill in the fields and hit the 'Save bot' button
* Restart the server (temporary workaround) for the newly created bot to get registered


## Google Drive Configuration ##

### Setup Google Drive Access for Server to Server ###

* Go to Credentials Management (https://console.developers.google.com/projectselector/apis/credentials)
* create a new project
* create the credentials (service account key, for server to server communication)
** create new service account
*** service account name should describe what the account will do (e.g., spark-drive)
*** select a role. Not yet sure the minimum role that we need. Start with project → owner
*** key type should be JSON
*** a JSON file download starts. Copy the contents of this file to the file bot/sample-gdrive-settings.json
* in the same site, select "Library" on the left
* make sure that the newly created project is selected (on top bar, after Google APIs logo)
* search for Google Drive API
* on the Google Drive API page, enable the API
* on the left menu, select credentials
* click on the "manage service accounts" link on the right
* the "service account ID" is an email used to share things to this account. Go to any drive folder, and then share it with this "user" (e.g., spark-drive@testdriveintegration-167213.iam.gserviceaccount.com).



### Setup Google Picker API for browser side file & folder selection ###

* go to the developers console (https://console.developers.google.com)
* select the project (the same from above)
* enable Google Picker API
* create credentials
* one API key is created, if following the wizard
* create "OAuth Client ID" credentials for the same project
** Configure consent screen. Fill only the mandatory fields (product name)
** Choose Web application for the application type
** a client ID and client secret are generated. Only need the client ID
* Use the information in the Google Drive settings page

### Box Configuration ###

* Follow the instructions of the Box guide on how to use Box Platform for custom app development found at https://developer.box.com/docs/getting-started-box-platform 
* Once you have generated the Public/Private Keypair, use the downloaded file and replace the contents of  bot/sample-box-settings.json
* At the Box configuration page, fill in the client id (you can find that at the file) and your Box user account (email address)
