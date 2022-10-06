const urlModel = require("../models/urlShortnerModel");
const shortid = require("shortid");
const redis = require("redis");
const Axios = require('axios'); 

const { promisify } = require("util");




//============================Connect to redis======================
const redisClient = redis.createClient(
  13838,
  "redis-13838.c212.ap-south-1-1.ec2.cloud.redislabs.com",
  { no_ready_check: true }
);
redisClient.auth("PACzNiDc4J6d7oYUbxR2fa8AgsXwcoUF", function (err) {
  if (err) throw err;
});

redisClient.on("connect", async function () {
  console.log("Connected to Redis..");
});



//==============================promisify============================

const SET_ASYNC = promisify(redisClient.SET).bind(redisClient);
const GET_ASYNC = promisify(redisClient.GET).bind(redisClient);

const isValid = function (value) {
  if (typeof value === "undefined" || value === null) return false;
  if (typeof value === "string" && value.trim().length === 0) return false;
  return true;
};



// //==========================================creating url==========================




const createUrl = async function (req, res) {
  try {
    let { longUrl } = req.body;

    if (!Object.keys(req.body).length > 0) {
      return res
        .status(400)
        .send({
          status: false,
          message: "Please enter recommended data in body",
        });
    };


    if (req.body.urlCode || req.body.shortUrl) {
      return res
        .status(400)
        .send({ status: false, messsage: "you have to enter only longUrl" });
    };

    if (!isValid(longUrl)) {
      return res.status(400).send({ status: false, message: "longUrl is required" });
    };


    let a = /^www\.[a-z0-9-]+(?:\.[a-z0-9-]+)*\.+(\w)*/

    if(a.test(longUrl)){
      longUrl="http://"+longUrl
    }

    let option = {
      method: "get",
      url: longUrl
  }

  let exist = await Axios(option)
      .then(() => longUrl)
      .catch(() => null)

  if (!exist) return res.status(400).send({ status: false, message: "url is not valid" })


    let cache = await GET_ASYNC(`${longUrl}`);
    if (cache) {
      cache = JSON.parse(cache);
      
      return res.status(400).send({ status: false, message: "Data from Cache", data: cache });

    }

    let checkExistUrl = await urlModel.findOne({ longUrl: longUrl }).select({ longUrl: 1, shortUrl: 1, urlCode: 1, _id:0 });

    if (checkExistUrl) {
      await SET_ASYNC(`${longUrl}`,JSON.stringify(checkExistUrl),"EX",60);

      return res.status(400).send({status: true, message: "url already present",data: checkExistUrl});
    }

    const urlCode = shortid.generate().toLowerCase();

    const baseUrl = "http://localhost:3000";

    const obj = {
      longUrl: longUrl,
      shortUrl: baseUrl + "/" + urlCode,
      urlCode: urlCode,
    };
    const createUrl = await urlModel.create(obj);
    return res
      .status(201)
      .send({ status: true, message: "shortUrl created", data: obj });
  } catch (err) {
    res
      .status(500)
      .send({ status: false, message: "server error", error: err.message });
  }
};

//---------------------------------------------get--------------------------------------------------------------------

const geturl = async function (req, res) {
  try {
    let urlCode = req.params.urlCode;

    if(/.*[A-Z].*/.test(urlCode)){
      return res.status(400).send({ status: false, message: "please Enter urlCode only in lowercase" })
  }
    

    let cachedata = await GET_ASYNC(`${urlCode}`);

    cachedata = JSON.parse(cachedata);

    if (cachedata) {

      res.redirect(cachedata.longUrl);

    } else {

      let orignalUrl = await urlModel.findOne({ urlCode: urlCode }).select({ _id: 0, longUrl: 1 });
      if (!orignalUrl)
      return res.status(404).send({ status: false, message: "urlCode not found" });

      await SET_ASYNC(`${urlCode}`, JSON.stringify(orignalUrl), "EX", 60);

      return res.status(302).redirect(orignalUrl.longUrl);
    }
  } catch (err) {

    return res.status(500).send({ status: false, message: "server error", error: err.message });

  }
};

module.exports = { createUrl, geturl };
