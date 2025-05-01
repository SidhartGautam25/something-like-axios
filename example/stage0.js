const myHttp = require("../lib");

myHttp("http://example.com", (err, data) => {
  if (err) {
    return console.error("Error:", err);
  }
  console.log("Response data:\n", data);
});
