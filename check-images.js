const fs = require("fs");
const text = fs.readFileSync("js/movies.js", "utf8");
const urls = [...text.matchAll(/(poster|backdrop): "([^"]+)"/g)].map((m) => [m[1], m[2]]);

(async () => {
  for (const [kind, url] of urls) {
    try {
      const res = await fetch(url, { method: "HEAD" });
      if (res.status !== 200) console.log(res.status, kind, url);
    } catch (err) {
      console.log("ERR", kind, url, err.message);
    }
  }
  console.log("done");
})();
