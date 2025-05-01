const myHttp = require("../lib");

// with query params and form data
myHttp(
  {
    url: "https://httpbin.org/post",
    method: "POST",
    params: { token: "abc123" },
    data: { name: "ChatGPT", type: "bot" },
  },
  (err, res) => {
    console.log("Form Response:\n", res);
  }
);

// with json data
myHttp(
  {
    url: "https://httpbin.org/post",
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    data: { message: "Hello, JSON!" },
  },
  (err, res) => {
    console.log("JSON Response:\n", res);
  }
);
