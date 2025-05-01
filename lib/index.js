"use strict";

const http = require("http");
const https = require("https");
const querystring = require("querystring");

/**
 * myHttp
 * Makes an HTTP(S) request with support for method and data.
 *
 * @param {object} options - Request options.
 * @param {string} options.url - The URL to request.
 * @param {string} [options.method="GET"] - HTTP method.
 * @param {object|string} [options.data] - Data to send in the request body (for POST, PUT, etc.).
 * @param {function} callback - Callback with (error, data).
 */
function myHttp(options, callback) {
  if (typeof options === "string") {
    options = { url: options };
  }

  const urlObj = new URL(options.url);
  const method = options.method ? options.method.toUpperCase() : "GET";
  const protocol = urlObj.protocol === "https:" ? https : http;

  let postData = null;
  const headers = {
    "User-Agent": "myHttpClient",
  };

  if (options.data) {
    if (typeof options.data === "object") {
      postData = querystring.stringify(options.data);
      headers["Content-Type"] = "application/x-www-form-urlencoded";
    } else if (typeof options.data === "string") {
      postData = options.data;
      headers["Content-Type"] = "text/plain";
    }
    headers["Content-Length"] = Buffer.byteLength(postData);
  }

  const reqOptions = {
    hostname: urlObj.hostname,
    port: urlObj.port || (urlObj.protocol === "https:" ? 443 : 80),
    path: urlObj.pathname + urlObj.search,
    method,
    headers,
  };

  const req = protocol.request(reqOptions, (res) => {
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

  if (postData && (method === "POST" || method === "PUT")) {
    req.write(postData);
  }

  req.end();
}

module.exports = myHttp;
