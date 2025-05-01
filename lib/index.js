"use strict";

const http = require("http");
const https = require("https");
const querystring = require("querystring");
const { EventEmitter } = require("events");
const zlib = require("zlib");

function myHttp(userOptions, callback, redirectCount = 0) {
  const MAX_REDIRECTS = 5;

  if (typeof userOptions === "string") {
    userOptions = { url: userOptions };
  }

  const emitter = new EventEmitter();

  const method = userOptions.method ? userOptions.method.toUpperCase() : "GET";
  const urlObj = new URL(userOptions.url);

  if (userOptions.params && typeof userOptions.params === "object") {
    Object.entries(userOptions.params).forEach(([key, value]) => {
      urlObj.searchParams.append(key, value);
    });
  }

  const protocol = urlObj.protocol === "https:" ? https : http;

  let postData = null;
  const headers = Object.assign(
    {
      "User-Agent": "myHttpClient",
      "Accept-Encoding": "gzip,deflate",
    },
    userOptions.headers || {}
  );

  if (userOptions.data) {
    if (headers["Content-Type"] === "application/json") {
      postData = JSON.stringify(userOptions.data);
    } else {
      headers["Content-Type"] =
        headers["Content-Type"] || "application/x-www-form-urlencoded";
      postData =
        typeof userOptions.data === "string"
          ? userOptions.data
          : querystring.stringify(userOptions.data);
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
    const status = res.statusCode;
    const location = res.headers.location;

    // 🔁 Handle redirects
    if (
      [301, 302, 303, 307, 308].includes(status) &&
      location &&
      redirectCount < MAX_REDIRECTS
    ) {
      const redirectMethod = status === 303 ? "GET" : method;
      const redirectOpts = {
        ...userOptions,
        url: new URL(location, urlObj).toString(),
        method: redirectMethod,
      };

      if (status === 303 || status === 301 || status === 302) {
        delete redirectOpts.data; // GET redirect removes body
      }

      // Recursively call myHttp with increased count
      const redirected = myHttp(redirectOpts, callback, redirectCount + 1);
      redirected.then(_resolve).catch(_reject);
      redirected.on("data", (d) => emitter.emit("data", d));
      redirected.on("end", () => emitter.emit("end"));
      redirected.on("error", (e) => emitter.emit("error", e));
      return;
    }

    // Decompression
    const isGzipped = res.headers["content-encoding"] === "gzip";
    const stream = isGzipped ? res.pipe(zlib.createGunzip()) : res;
    stream.setEncoding("utf8");

    let fullBody = [];
    let length = 0;

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
