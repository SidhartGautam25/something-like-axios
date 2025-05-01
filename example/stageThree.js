const myHttp = require("../lib");

const req = myHttp(
  "https://jsonplaceholder.typicode.com/posts/1",
  (err, data) => {
    if (err) return console.error("Callback Error:", err);
    console.log("Callback Response Done");
  }
);

req.on("data", (chunk) => {
  console.log("Streaming chunk:", chunk.length);
});

req.on("end", () => {
  console.log("Streaming finished");
});
