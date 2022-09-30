const validUrl = require("valid-url");
const urlmodel = require("../models/urlShortnerModel");
const shortid = require("shortid");

const isValid = function (value) {
  if (typeof value === "undefined" || value === null) return false;
  if (typeof value === "string" && value.trim().length === 0) return false;
  return true;
};

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
    let findurl = await urlmodel.findOne({ longUrl: longUrl }).select({ longUrl: 1, shortUrl: 1, urlCode: 1, _id: 0 });


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


    const createData = await urlmodel.create(urlData);


    return res.status(201).send({ status: true, data: createData });

  } catch (error) {
    return res.status(500).send({ status: false, error: error.message });
  }
};



const getUrl = async function (req, res) {
  try {
    const urlCode = req.params.urlCode

    let shortModel = await urlmodel.findOne({ urlCode: urlCode }).select({ _id: 0, longUrl: 1 });


    if (!shortModel)
      return res.status(400).send({ status: false, msg: "link not found" });

    return res.status(302).redirect(shortModel.longUrl);
  } catch (error) {
    return res.status(500).send({ status: false, msg: error.message });
  }
};

module.exports.getUrl = getUrl;

module.exports.createUrl = createUrl;
