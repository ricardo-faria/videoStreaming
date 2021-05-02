const express = require("express");
const app = express();
const path = require("path");
const fs = require("fs");
require("dotenv").config();

const videosLocale = process.env.VIDEOS_LOCALE;

const dirPath = path.join(videosLocale);

app.use(express.static(__dirname + "/public"));
app.set("view engine", "ejs");
app.set("views", "./views");

//read files to list in the home
const files = fs.readdirSync(dirPath).map((name) => {
	return {
		name: path.parse(name).name,
		url: `/video/${name}`,
	};
});

//home
app.get("/", (req, res) => {
	res.render("home", { files });
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

	// verify if range header is provided
	const range = req.headers.range;
	if (!range) {
		res.status(400).send("Requires Range header");
	}

	const videoPath = dirPath + videoName;
	const videoSize = fs.statSync(dirPath + videoName).size;

	// get the chunk start and end to send to client
	const CHUNK_SIZE = 1000000; // 1MB
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

	// set HTTP Status 206 for partial content
	res.writeHead(206, headers);

	// create video read stream for this particular chunk
	const videoStream = fs.createReadStream(videoPath, { start, end });

	//wait the stream is done and then send the video chunk to client
	videoStream.on("open", () => {
		videoStream.pipe(res);
	});
});

app.listen(8000, function () {
	console.log("Listening on port 8000!");
});
