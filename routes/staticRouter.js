const express = require("express");
const { URL } = require("../models/url");
const router = express.Router();

router.get("/", async(req, res,) =>{
    const allurls = await URL.find({});
    return res.render("home",{
        urls: allurls,
        id:null
    })
});
router.get("/clear-history", async (req, res) => {
  await URL.deleteMany({});
  return res.redirect("/");
});

module.exports = router;