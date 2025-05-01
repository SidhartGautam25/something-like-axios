"use strict";

const http = require("http");
const https = require("https");
const querystring = require("querystring");
const { EventEmitter } = require("events");
const zlib = require("zlib");

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
      "Accept-Encoding": "gzip,deflate", // Important for enabling gzip support
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

  let _resolve, _reject;
  const promise = new Promise((resolve, reject) => {
    _resolve = resolve;
    _reject = reject;
  });

  const req = protocol.request(reqOptions, (res) => {
    let fullBody = [];
    let length = 0;

    // Gzip handling
    const isGzipped = res.headers["content-encoding"] === "gzip";
    const stream = isGzipped ? res.pipe(zlib.createGunzip()) : res;
    stream.setEncoding("utf8");

    stream.on("data", (chunk) => {
      emitter.emit("data", chunk);
      fullBody.push(chunk);
      length += chunk.length;
    });

    stream.on("end", () => {
      emitter.emit("end");
      const responseBody = fullBody.join("");
      if (typeof callback === "function") {
        callback(null, responseBody, res);
      }
      _resolve(responseBody);
    });

    stream.on("error", (err) => {
      emitter.emit("error", err);
      if (typeof callback === "function") {
        callback(err, null);
      }
      _reject(err);
    });
  });

  req.on("error", (err) => {
    emitter.emit("error", err);
    if (typeof callback === "function") {
      callback(err, null);
    }
    _reject(err);
  });

  if (postData && (method === "POST" || method === "PUT")) {
    req.write(postData);
  }

  req.end();

  emitter.then = promise.then.bind(promise);
  emitter.catch = promise.catch.bind(promise);

  return emitter;
}

module.exports = myHttp;
