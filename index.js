const express = require("express");
const app = express();
const path = require("path");
const fs = require("fs");
require('dotenv').config();

const videosLocale = process.env.VIDEOS_LOCALE

const dirPath = path.join(videosLocale);

app.use(express.static(path.join(__dirname, '/public')));
app.set("view engine", "ejs");
app.set('views', './views');

//read files to list in the home
const files = fs.readdirSync(dirPath).map(name => {
  return {
    name: path.parse(name).name,
    url: `/video/${name}`
  };
});

//home
app.get("/", (req, res) => {
  res.render("index", { files });
});

//player
app.get("/video/:video", (req, res) => {
  let video = req.params.video;
  let videoName = path.parse(video).name;

  res.render("player", { video, videoName });
});


//streaming
app.get("/videoStreaming/:video", function (req, res) {
  let videoName = req.params.video;

  // Ensure there is a range given for the video
  const range = req.headers.range;
  if (!range) {
    res.status(400).send("Requires Range header");
  }

  const videoPath = dirPath+videoName;    //"Mr. Nobody 2009 Dublado.mkv";
  const videoSize = fs.statSync(dirPath+videoName).size;

  // Parse Range
  // Example: "bytes=32324-"
  const CHUNK_SIZE = 10 ** 6; // 1MB
  const start = Number(range.replace(/\D/g, ""));
  const end = Math.min(start + CHUNK_SIZE, videoSize - 1);

  // Create headers
  const contentLength = end - start + 1;
  const headers = {
    "Content-Range": `bytes ${start}-${end}/${videoSize}`,
    "Accept-Ranges": "bytes",
    "Content-Length": contentLength,
    "Content-Type": "video/mp4",
  };

  // HTTP Status 206 for Partial Content
  res.writeHead(206, headers);

  // create video read stream for this particular chunk
  const videoStream = fs.createReadStream(videoPath, { start, end });

  // Stream the video chunk to the client
  videoStream.pipe(res);
});


app.listen(8000, function () {
  console.log("Listening on port 8000!");
});
