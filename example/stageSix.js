const myHttp = require("../lib");

// redirect option
myHttp("http://github.com")
  .then((res) => console.log("Followed redirect successfully!"))
  .catch((err) => console.error("Error following redirect:", err));

//zip enabled
myHttp("https://jsonplaceholder.typicode.com/posts/1")
  .then((res) => {
    console.log("Decompressed response:", res.slice(0, 100));
  })
  .catch((err) => console.error("Error:", err));

// promise style
myHttp("https://jsonplaceholder.typicode.com/posts/1")
  .then((res) => {
    console.log("Got response via Promise:\n", res);
  })
  .catch((err) => {
    console.error("Error:", err);
  });

// async await style
(async () => {
  try {
    const res = await myHttp("https://jsonplaceholder.typicode.com/posts/2");
    console.log("Async/Await Response:", res);
  } catch (e) {
    console.error("Async/Await Error:", e);
  }
})();

// stream + callback style
const req = myHttp(
  "https://jsonplaceholder.typicode.com/posts/3",
  (err, data) => {
    console.log("Callback result:", data.length);
  }
);

req.on("data", (chunk) => console.log("Chunk size:", chunk.length));
req.on("end", () => console.log("Stream end"));
