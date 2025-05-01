"use strict";

const http = require("http");
const https = require("https");
const querystring = require("querystring");
const { EventEmitter } = require("events");

function myHttp(options, callback) {
  if (typeof options === "string") {
    options = { url: options };
  }

  const emitter = new EventEmitter();

  const method = options.method ? options.method.toUpperCase() : "GET";
  const urlObj = new URL(options.url);

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

  if (options.data) {
    if (headers["Content-Type"] === "application/json") {
      postData = JSON.stringify(options.data);
    } else {
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
    let fullBody = "";
    res.setEncoding("utf8");

    res.on("data", (chunk) => {
      emitter.emit("data", chunk);
      fullBody += chunk;
    });

    res.on("end", () => {
      emitter.emit("end");
      if (typeof callback === "function") {
        callback(null, fullBody, res);
      }
    });

    res.on("error", (err) => {
      emitter.emit("error", err);
      if (typeof callback === "function") {
        callback(err, null);
      }
    });
  });

  req.on("error", (err) => {
    emitter.emit("error", err);
    if (typeof callback === "function") {
      callback(err, null);
    }
  });

  if (postData && (method === "POST" || method === "PUT")) {
    req.write(postData);
  }

  req.end();

  return emitter;
}

module.exports = myHttp;
