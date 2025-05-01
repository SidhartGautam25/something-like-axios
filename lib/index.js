"use strict";

const http = require("http");
const https = require("https");
const querystring = require("querystring");

/**
 * myHttp
 * HTTP client with query params and flexible body encoding.
 *
 * @param {object|string} options
 * @param {function} callback
 */
function myHttp(options, callback) {
  if (typeof options === "string") {
    options = { url: options };
  }

  const method = options.method ? options.method.toUpperCase() : "GET";
  const urlObj = new URL(options.url);

  // Append query params to URL
  if (options.params && typeof options.params === "object") {
    Object.entries(options.params).forEach(([key, value]) => {
      urlObj.searchParams.append(key, value);
    });
  }

  const protocol = urlObj.protocol === "https:" ? https : http;

  let postData = null;
  const headers = Object.assign(
    {
      "User-Agent": "myHttpClient",
    },
    options.headers || {}
  );

  // Handle body encoding
  if (options.data) {
    if (headers["Content-Type"] === "application/json") {
      postData = JSON.stringify(options.data);
    } else {
      // Default to x-www-form-urlencoded
      headers["Content-Type"] =
        headers["Content-Type"] || "application/x-www-form-urlencoded";
      postData =
        typeof options.data === "string"
          ? options.data
          : querystring.stringify(options.data);
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
