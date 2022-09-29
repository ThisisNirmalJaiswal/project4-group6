const express = require('express');
const router = express.Router();
const urlController = require("../controller/urlController");


//============================create URl shorten api=================

router.post("/url/shorten", urlController.createUrl);


//========================get url api=============================

router.get("/:urlCode", urlController.getUrl);



//=========================== if the endpoint are correct or not ==========================================
router.all("*", function (req, res) {
    res.status(404).send({
        status: false,
        message: "Invalid Url"
    })
})


module.exports = router;


