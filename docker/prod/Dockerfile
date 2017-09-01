FROM node:8.4.0

RUN apt-get update && apt-get install -y curl
RUN curl -sS https://dl.yarnpkg.com/debian/pubkey.gpg | apt-key add -
RUN echo "deb https://dl.yarnpkg.com/debian/ stable main" | tee /etc/apt/sources.list.d/yarn.list

RUN apt-get install apt-transport-https
RUN apt-get update && apt-get install -y yarn

WORKDIR /opt/ciscospark
COPY . .

RUN yarn # install project dependencies
#RUN npm run cleanAndSetupDatabase

ENTRYPOINT ["./entrypoint.sh"]