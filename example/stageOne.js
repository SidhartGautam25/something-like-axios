const myHttp = require("../lib");

// for get request
myHttp("https://jsonplaceholder.typicode.com/posts/1", (err, data) => {
  console.log("GET Response:\n", data);
});

// for post request
myHttp(
  {
    url: "https://jsonplaceholder.typicode.com/posts",
    method: "POST",
    data: { title: "foo", body: "bar", userId: 1 },
  },
  (err, data) => {
    console.log("POST Response:\n", data);
  }
);
