const validUrl = require("valid-url");
const urlModel = require("../models/urlShortnerModel");
const shortid = require("shortid");
const redis = require("redis");

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


//==========================================creating url==========================



const createUrl = async function (req, res) {
  try {
   
    let {longUrl} = req.body;

    if (!Object.keys(req.body).length > 0) {
        return res
          .status(400)
          .send({ status: false, message: "Please provide some data in body" });
      }

  
    if(req.body.urlCode||req.body.shortUrl){
        return res.status(400).send({status:false, messsage:"you have to enter only longUrl"});
    }


    if (!isValid(longUrl)) {
      return res
        .status(400)
        .send({ status: false, message: "longUrl is required" });
    }


    if (!validUrl.isUri(longUrl)) {
      return res.status(400).send({ status: false, message: "invalid url" });
    }
    let findurl = await urlModel.findOne({ longUrl: longUrl }).select({ longUrl: 1, shortUrl: 1, urlCode: 1,_id:0});


    if (findurl) {
      return res
        .status(200)
        .send({ status: true, message: "url already present", data: findurl });
    }


    const urlCode = shortid.generate().toLocaleLowerCase();



    const urlData = {
      longUrl: longUrl,
      urlCode: urlCode,
      shortUrl: "http://localhost:3000" + "/" + urlCode,
    };

    // const 

    const createData = await (await urlModel.create(urlData)).select({ _id:0, __v:0, createdAt:0, updatedAt:0})

    return res.status(201).send({ status: true, data: createData });

  } catch (error) {
    return res.status(500).send({ status: false, error: error.message });
  }
};


//=====================getting url=======================================

const getUrl = async function (req, res) {
  try{
      const urlCode = req.params.urlCode

      if(!shortid.isValid(urlCode)){
          return res.status(400).send({status: false, message: "Url Code is not a valid urlCode. Please provide correct input"})
      }
      let cachedURLCode = await GET_ASYNC(urlCode)
      if(cachedURLCode){
          return res.status(302).redirect(cachedURLCode)
      } else{
          const cachedData = await urlModel.findOne({urlCode : urlCode})
          if(!cachedData){
              return res.status(404).send({status: false, message: "URL Not Found"})
          }
          await SET_ASYNC(cachedData.longUrl)
          return res.status(302).redirect(urlCode,cachedData.longUrl)
      }

  } catch(err){
      return res.status(500).send({ status: false, Error: err.message})
  }

}


module.exports = {createUrl, getUrl}
