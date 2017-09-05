# README

This project uses BotKit


### What is this repository for?

* Cisco Onboarding Bot by Bitmaker


### What is involved?
In order to successfully setup the Cisco Onboarding Bot, the following tasks need to be performed:
* Create a .env file for storing the main settings
* Create a database (PostgresSQL)
* Expose a public HTTPS endpoint (so Cisco Spark can access your bot)
* Configure a new Cisco Spark Integration for handling user authetication via oAuth
* Configure a new Cisco Bot
* Configure Google Drive integration (optional)
* Configure Box integration (optional)
* Launch your Onboarding server 
* Go to the settings page and register the bot you created and enter the information needed for integrating with Google Drive and/or Box
* Create as many onboarding flows as you want and send them to users

# Project set up

## General Steps
### .env file
* Create a .env file on the bot dir (_/bot/.env_) with the Cisco Spark App information (more on this later), the database connection settings and the base url where the server will be running (for authentication purposes)
* You may use the _/bot/.env.template_ file as a template for your own _.env_ file

### Database
* You will need a PostgreSQL database (**see the Docker section bellow**)
* _(optional)_ use [pgAdmin](https://www.postgresql.org/ftp/pgadmin) to manage the database
* Create the database (e.g. ciscosparkonboarding) and the user (e.g. ciscosparkbot)
* **If not using Docker**, update your _bot/.env_ file with the database credentials, for example:
```
db_user=ciscosparkbot
db_pass=lNhV6HjFbIJF5n0L6eyEBEiqpQu7q6  
db_host=localhost
db_port=5432
db_db=ciscosparkonboarding
```
### Dependencies
* Run `npm install` or `yarn` to install the project dependencies

### Public endpoint
* If you are _not_ running your bot at a public, SSL-enabled internet address, use a tool like [ngrok](http://ngrok.io/) or [localtunnel](http://localtunnel.me/) to create a secure route to your development application, and copy the address (http**s**://) to the bot configuration  **public_address** variable at the settings page (see below).  
* If that's the case, run `ngrok http 8080` for starting ngrok in production or `ngrok http 3000` for starting in dev _[warning: Ubuntu's ngrok package is version 1.x and is not working]_

## Cisco Spark Steps
### Cisco Spark Integration
* Go to [https://developer.ciscospark.com](https://developer.ciscospark.com) and create a **Cisco Spark App Integration** in order to configure OAuth authentication
* Enter the information requested.
* In the **Redirect URI(s)** field, you should enter an url in the form:
`<oauth_base_url>/auth/spark/callback` where `oauth_base_url` is the base url of your server (note that this is not required to be the public endpoint defined previously, since the only requirement is that it has to be accessible by your clients, not the Cisco Spark platform).
* In the **Scopes** field, select the following options: `spark:all, spark-admin:people_read, spark-admin:organizations-read and spark-admin:roles-read`

* Update your _bot/.env_ file with the Client ID, Client Secret and the Redirect URI (only the base url part) of the integration you just created

### Cisco Spark Bot
* Go to [https://developer.ciscospark.com](https://developer.ciscospark.com) and create a new **Cisco Spark Bot**
* Make sure you save the bot's access token since you will not be able to see it again (although you can generate a new one at any time). The access token is necessary for registering the bot in the onboarding server 

## Google Drive Configuration

### Setup Google Drive Access for server-to-server

* Go to Google APIs & services Credentials page [(https://console.developers.google.com/apis/credentials)](https://console.developers.google.com/apis/credentials)
* Create a new project [(https://console.developers.google.com/projectcreate)](https://console.developers.google.com/projectcreate)
* Select **Library** on the left and search for Google Drive API [(https://console.developers.google.com/apis/api/drive.googleapis.com/overview)](https://console.developers.google.com/apis/api/drive.googleapis.com/overview)
* Make sure that the newly created project is selected (on the top bar, after the Google APIs logo) and on the Google Drive API page click **ENABLE**

* On the left menu, select _Credentials_
* Create the credentials (**service account key**, for server-to-server communication)
    * create a new service account
        * service account name should describe what the account will do (e.g. spark-drive)
        * select a role (not yet sure the minimum role that we need; start with Project → Owner)
        * key type should be JSON
        * a JSON file download starts. You must upload it in the manager [settings page](http://localhost:8080/settings).
* Click on the **manage service accounts** link on the right (credentials page)
* the _Service account ID_ is an email address used to share documents to this account. Go to any Drive folder and then share it with this "user" (e.g., spark-drive@testdriveintegration-167213.iam.gserviceaccount.com).

### Setup Google Picker API for browser-side file & folder selection

* Go to the developers console [(https://console.developers.google.com)](https://console.developers.google.com)
* select the project (the same from above) and go to Library, search for Google Picker API
* **ENABLE** the Google Picker API [(https://console.developers.google.com/apis/api/picker.googleapis.com/overview)](https://console.developers.google.com/apis/api/picker.googleapis.com/overview)
* Create credentials
* one API key is created, if following the wizard
* create "OAuth Client ID" credentials for the same project
    * Configure consent screen. Fill only the mandatory fields (product name)
    * Choose Web application for the application type
    * A client ID and client secret are generated. You only need the **client ID**
* Use the information in the Google Drive settings page

## Box Configuration

* Follow the instructions of the Box guide on how to use Box Platform for custom app development found at [https://developer.box.com/docs/getting-started-box-platform](https://developer.box.com/docs/getting-started-box-platform) 
* Once you have generated the Public/Private Keypair, use the downloaded file and upload it in the manager [settings page](http://localhost:8080/settings).
* At the Box configuration page, fill in the client ID (you can find that at the file you just downloaded) and your Box user account (email address)


## Launching the Server
### Run on local machine in development mode
* Before the first run you will need to do a `npm run cleanAndSetupDatabase` that will setup your database with the required fixtures
* `npm run dev` will start the development server
* You can now access [http://localhost:3000](http://localhost:3000) and log in using your Cisco Spark credentials

### Run on local machine in production mode
* `npm build` will build the project
* `npm start` will start the project
* You can now access [http://localhost:8080](http://localhost:8080) and log in using your Cisco Spark credentials

### Bot configuration

* After logging in, access the [settings page](http://localhost:8080/settings) and add a new bot configuration
* Fill in the fields and hit the `Save bot` button


## Docker
### Database
* Create a container based on postgres (use --detach or -d to run in background):  
`docker run --name cisco-onboarding-database -e POSTGRES_PASSWORD=mysecretpassword postgres`  
_This image includes EXPOSE 5432 (the postgres port), so standard container linking will make it automatically available to the linked containers. The default postgres user and database are created in the entrypoint with initdb._
* To attach (if running in background): `docker attach cisco-onboarding-database` (`Ctrl P + Q` to detach)  
* Connect via `psql` to create the user and the database:  

`docker run -it --rm --link cisco-onboarding-database:postgres postgres psql -h postgres -U postgres`  
```
CREATE ROLE yourdatabaseuser WITH LOGIN PASSWORD 'yourdatabasepassword' CREATEDB; -- (gives Create DB permission)
\du
CREATE DATABASE yourdatabasename;
GRANT ALL PRIVILEGES ON DATABASE yourdatabasename TO yourdatabaseuser;
\list -- (list databases)
\c yourdatabasename -- (use this database)
\d -- (list of relations)
```

### The project
* There is a Dockerfile provided
* Build the image  
`docker build -t img-cisco-onboarding:latest -f docker/prod/Dockerfile .`
* Create a container based on that image:  

#### Using the database on another Docker:  
```
docker run \
--name cisco-onboarding \
--link cisco-onboarding-database:postgres \
-p 8080:8080 \
-e db_host=cisco-onboarding-database \
-e db_port=5432 \
-e db_user=yourdatabaseuser \
-e db_pass=yourdatabasepassword \
-e db_db=yourdatabasename \
-e oauth_base_url=http://localhost:3000 \
img-cisco-onboarding
```  
#### Using the database on the host:  
```
docker run \
--name cisco-onboarding \
--network=host \
-p 8080:8080 \
-e db_user=yourdatabaseuser \
-e db_host=localhost \
-e db_port=5432 \
-e db_pass=yourdatabasepassword \
-e db_db=yourdatabasename \
-e oauth_base_url=http://localhost:3000 \
img-cisco-onboarding
```  
_--network=host_ — to use the host network and be able to connect to the localhost (host) database  
_-p 8080:8080_ — to expose container port (hostPort:containerPort)  
_-e …_ — environment variables  

* If you need to reset the database:  
`docker exec cisco-onboarding npm run cleanAndSetupDatabase`

* To run an interactive shell:  
`docker exec -it cisco-onboarding bash`

* To restart the container, if needed (`docker ps` to see running instances):  
`docker stop cisco-onboarding`  
`docker start --attach cisco-onboarding`  
