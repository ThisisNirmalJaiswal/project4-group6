const express = require('express');
const router = express.Router();
const urlController = require("../controller/urlController");


//============================create URl shorten api=================

router.post("/url/shorten", urlController.urlShorten);


//========================get url api=============================

router.get("/:urlCode", urlController.getUrl);


module.exports = router;


