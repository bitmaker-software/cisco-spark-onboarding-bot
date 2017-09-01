# README

This project uses BotKit


### What is this repository for?

* Cisco Onboarding Bot by Bitmaker


## How do I get set up?

* Create a .env file on the bot dir (_/bot/.env_) with the Cisco Spark App information (more on this later) plus the database connection settings (use the _.env.template_ file as a model)

##### Database
* You will need a PostgreSQL database (**see the Docker section bellow**)
* _(optional)_ use [pgAdmin](https://www.postgresql.org/ftp/pgadmin) to manage the database
* Create the database (e.g. ciscosparkonboarding) and the user (e.g. ciscosparkbot)
* Update your _bot/.env_ file with the database credentials, for example:

  `db_user=ciscosparkbot`   
  `db_pass=lNhV6HjFbIJF5n0L6eyEBEiqpQu7q6`  
  `db_host=localhost`  
  `db_port=5432`  
  `db_db=ciscosparkonboarding`

##### Dependencies
* Run `npm install` or `yarn` to install the project dependencies

##### Public endpoint
* If you are _not_ running your bot at a public, SSL-enabled internet address, use a tool like [ngrok](http://ngrok.io/) or [localtunnel](http://localtunnel.me/) to create a secure route to your development application, and copy the address (http**s**://) to the .env file **public_address** variable:  
  `ngrok http 3000` _[warning: Ubuntu's ngrok package is version 1.x and is not working]_

##### Bot account
* Go to [https://developer.ciscospark.com](https://developer.ciscospark.com) and create a **Cisco Spark App Integration** in order to configure OAuth authentication

##### Run
* Before the first run you will need to do a `npm run cleanAndSetupDatabase` that will setup your database with the required fixtures
* `npm run dev` will start the development server
* You can now access [http://localhost:3000](http://localhost:3000) and log in using your Cisco Spark credentials


## Bot configuration

* After logging in, access the [settings page](http://localhost:3000/settings) and add a new bot configuration
* Fill in the fields and hit the `Save bot` button
* Restart the server (temporary workaround) for the newly created bot to get registered with Cisco Spark


## Google Drive Configuration

### Setup Google Drive Access for server-to-server

* Go to Google APIs & services Credentials page (https://console.developers.google.com/apis/credentials)
* Create a new project (https://console.developers.google.com/projectcreate)
* Select **Library** on the left and search for Google Drive API (https://console.developers.google.com/apis/api/drive.googleapis.com/overview)
* Make sure that the newly created project is selected (on the top bar, after the Google APIs logo) and on the Google Drive API page click **ENABLE**

* On the left menu, select _Credentials_
* Create the credentials (**service account key**, for server-to-server communication)
    * create a new service account
        * service account name should describe what the account will do (e.g. spark-drive)
        * select a role (not yet sure the minimum role that we need; start with Project → Owner)
        * key type should be JSON
        * a JSON file download starts. Copy the contents of this file to the file _bot/sample-gdrive-settings.json_
* Click on the **manage service accounts** link on the right (credentials page)
* the _Service account ID_ is an email address used to share documents to this account. Go to any Drive folder and then share it with this "user" (e.g., spark-drive@testdriveintegration-167213.iam.gserviceaccount.com).



### Setup Google Picker API for browser-side file & folder selection

* Go to the developers console (https://console.developers.google.com)
* select the project (the same from above) and go to Library, search for Google Picker API
* **ENABLE** the Google Picker API (https://console.developers.google.com/apis/api/picker.googleapis.com/overview)
* Create credentials
* one API key is created, if following the wizard
* create "OAuth Client ID" credentials for the same project
    * Configure consent screen. Fill only the mandatory fields (product name)
    * Choose Web application for the application type
    * A client ID and client secret are generated. You only need the **client ID**
* Use the information in the Google Drive settings page

## Box Configuration

* Follow the instructions of the Box guide on how to use Box Platform for custom app development found at https://developer.box.com/docs/getting-started-box-platform 
* Once you have generated the Public/Private Keypair, use the downloaded file and replace the contents of _bot/sample-box-settings.json_
* At the Box configuration page, fill in the client ID (you can find that at the file you just downloaded) and your Box user account (email address)

## Docker
### Database
* Build the image  
`docker build -t cisco-onboarding-database:latest -f docker/database/Dockerfile .`
* Create a container based on that image (start an instance, use --detach or -d to run in background):  
`docker run --name cisco-onboarding-database -e POSTGRES_PASSWORD=mysecretpassword cisco-onboarding-database`  
_This image includes EXPOSE 5432 (the postgres port), so standard container linking will make it automatically available to the linked containers. The default postgres user and database are created in the entrypoint with initdb._
* To attach (if running in background):  
`docker attach cisco-onboarding-database` (`Ctrl P + Q` to detach)
* Connect via `psql` to create the user and the database:  
`docker run -it --rm --link cisco-onboarding-database:postgres postgres psql -h postgres -U postgres`  
`CREATE ROLE yourdatabaseuser1 WITH LOGIN PASSWORD 'yourdatabasepassword' CREATEDB;` (gives Create DB permission)  


* To restart:
`docker stop cisco-onboarding-database`
`docker start cisco-onboarding-database`
### The project
* There is a Dockerfile provided
* Build the image  
`docker build -t cisco-onboarding:latest -f docker/prod/Dockerfile .`
* Create a container based on that image:  
  ###### Using the database on another Docker:
  `docker run --name cisco-onboarding --link cisco-onboarding-database:postgres -p 3000:3000 -e db_user=yourdatabaseuser -e db_pass=yourdatabasepassword -e db_host=localhost -e db_port=5432 -e db_db=yourdatabasename cisco_onboarding`      
  ###### Using the database on the host:
  `docker run --name cisco-onboarding --network=host -p 3000:3000 -e db_user=yourdatabaseuser -e db_pass=yourdatabasepassword -e db_host=localhost -e db_port=5432 -e db_db=yourdatabasename cisco_onboarding`      
_--network=host_ to use the host network and be able to connect to the localhost (host) database  
_-p 3000:3000_ to expose container port (hostPort:containerPort)  
_-e …_ environment variables

* If you need to reset the database:  
`docker exec cisco-onboarding npm run cleanAndSetupDatabase`

* To restart the container (`docker ps` to see running instances):  
`docker stop cisco-onboarding`  
`docker start cisco-onboarding`