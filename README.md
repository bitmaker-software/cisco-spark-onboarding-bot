# README #

This project uses BotKit


### What is this repository for? ###

* Cisco Onboarding Bot by Bitmaker


### How do I get set up? ###

* (optional) download https://www.postgresql.org/ftp/pgadmin to manage the database (next point)
* Create the database (e.g. ciscosparkonboarding) and the user (e.g. ciscosparkbot)


$ su - postgres 
$ CREATE USER ciscosparkbot WITH PASSWORD 'ciscosparkbot';
$ GRANT ALL PRIVILEGES ON DATABASE "ciscosparkonboarding" to ciscosparkbot;

* npm install / yarn (to install the dependencies)
* Expose the bot localhost endpoint (_ngrok http 3000_) _[warning: Ubuntu's ngrok package is version 1.x and is not working]_ and copy the https:// address to the .env file **public_address** variable (next point)
* Create the .env file on the bot dir (_/bot/.env_) with the credentials - talk to @andrefv
* npm run dev (to have the development server running)


### Who do I talk to? ###

* @andrefv, @tiagofernandes


### Missing ###
* Register a new bot at https://developer.ciscospark.com
* My Apps -> create one -> Create a Bot
* Copy the Access Token to the .env file
* Copy the secret (by clicking in the user logo) to the env file
