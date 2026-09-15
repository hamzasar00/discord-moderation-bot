const { client } = global;
const { readdir } = require("fs");

readdir("./src/events", (err, files) => {
  if (err) return console.error(err);
  files
    .filter((file) => file.endsWith(".js"))
    .forEach((file) => {
      let prop = require(`../events/${file}`);
      if (!prop.conf) return;
      const listener = (...args) => {
        Promise.resolve(prop(...args)).catch(error => {
          console.error(`[EVENT] ${prop.conf.name} failed`, error);
        });
      };
      if (prop.conf.event === 'INTERACTION_CREATE') client.ws.on(prop.conf.event, listener);
      else client.on(prop.conf.event, listener);
      console.log(`[EVENT] ${prop.conf.name} Loaded`);
    });
});