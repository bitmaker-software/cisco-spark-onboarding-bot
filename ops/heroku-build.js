'use strict';

if ('HEROKU' in process.env || ('DYNO' in process.env && process.env.HOME === '/app')) {

  const pkg = require('../package.json');
  const ChildProcess = require('child_process');


  let deps = pkg.devDependencies;
  let packages = "";

  Object.keys(deps).forEach((key) => {
    packages += `${key}@${deps[key]} `; // note space at end to separate entries
  });

  try {
    console.time("install");
    console.log("starting npm install of dev dependencies");
    console.log(packages);
    ChildProcess.execSync(`npm install ${packages}`);
    console.timeEnd("install");

    console.time("build");
    console.log("starting npm build");
    ChildProcess.execSync(`npm run build`);
    console.timeEnd("build");

    console.time("uninstall");
    console.log("starting npm uninstall of dev dependencies");
    ChildProcess.execSync(`npm uninstall ${packages}`);
    console.timeEnd("uninstall");
  }
  catch (err) {
    console.error(err.message);
  }
} else {
  console.log("Not Heroku, skipping postinstall build");
}