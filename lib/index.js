"use strict";

const http = require("http");
const https = require("https");

/**
 * myHttp
 * Makes a simple HTTP(S) GET request.
 *
 * @param {string} urlStr - The URL to request.
 * @param {function} callback - Callback with (error, data).
 */
function myHttp(urlStr, callback) {
  const parsedUrl = new URL(urlStr);
  const protocol = parsedUrl.protocol === "https:" ? https : http;

  const options = {
    hostname: parsedUrl.hostname,
    port: parsedUrl.port || (parsedUrl.protocol === "https:" ? 443 : 80),
    path: parsedUrl.pathname + parsedUrl.search,
    method: "GET",
    headers: {
      "User-Agent": "myHttpClient",
    },
  };

  const req = protocol.request(options, (res) => {
    let data = "";

    res.setEncoding("utf8");

    res.on("data", (chunk) => {
      data += chunk;
    });

    res.on("end", () => {
      callback(null, data);
    });
  });

  req.on("error", (err) => {
    callback(err);
  });

  req.end();
}

module.exports = myHttp;
