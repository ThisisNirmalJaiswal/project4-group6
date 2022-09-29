const UrlModel = require("../models/urlShortnerModel");
const shortId = require('shortid');
const validUrl = require('valid-url')

const isValid = function (value) {
  if (typeof value === "undefined" || typeof value === null) return false;
  if (typeof value === "string" && value.trim().length == 0) return false;
  return true;
};

const shorternUrl = async function (req, res) {
  try {
    let data = req.body;

    if (Object.keys(data).length == 0) {
      return res.status(400).send({status: false, message: "Invalid Url please provide valid details",});
    }
    if(!data.urlCode){
        return res.status(400).send({ status:false, message:"provide urlcode pls"})
    }
    if (!isValid(data.longUrl)) {
      return res.status(400).send({ status: false, message: "Please give the long URL" });
    }

    if (!validUrl(data.longUrl)) {
      return res.status(400).send({ status: false, message: "Enter a valid url" });
    }

    let checkUrl = await UrlModel.findOne({ longUrl: data.longUrl }).select({_id: 0,__v: 0,createdAt: 0,updatedAt: 0,});
    if (checkUrl) {
      return res.status(200).send({ status: true, message: "Success", data: checkUrl });
    }

    const baseUrl = "http://localhost:3000";
    const shortUrl = baseUrl + "/" + shortId.generate().toLowerCase();

    let url = await model.create({ longUrl, shortUrl, urlCode });
        res.status(201).send({status: true,message: "URL create successfully",data: url});
  } catch (err) {
    res.status(500).send({ status: false, error: err.message });
  }
};

module.exports.shorternUrl = shorternUrl;
