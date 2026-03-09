const QRCode = require("qrcode");
const shortid = require("shortid");
const { URL } = require("../models/url");
const redisClient = require("../config/redis");

async function handleGenerateNewShortURL(req, res) {
    const body = req.body;

    if (!body.url)
        return res.status(400).json({ error: "URL is required" });

    const shortID = shortid();

    await URL.create({
        shortId: shortID,
        redirectUrl: body.url,
        visitHistory: []
    });

    const allUrls = await URL.find({});

    // 🔥 Generate QR codes for each URL
    const urlsWithQR = await Promise.all(
        allUrls.map(async (url) => {

            const shortUrl = `${req.protocol}://${req.get("host")}/url/${url.shortId}`;

            const qrCode = await QRCode.toDataURL(shortUrl);

            return {
                ...url.toObject(),
                qrCode
            };
        })
    );

    return res.render("home", {
        id: shortID,
        urls: urlsWithQR,
    });
}

async function handleGetAnalytics(req, res) {
    const shortId = req.params.shortId;

    const result = await URL.findOne({ shortId });

    return res.json({
        totalClicks: result.visitHistory.length,
        analytics: result.visitHistory,
    });
}

async function handleRedirect(req, res) {

    const shortId = req.params.shortId;

    // check Redis cache
    const cachedUrl = await redisClient.get(shortId);

    if (cachedUrl) {
        console.log("Cache HIT");
        return res.redirect(cachedUrl);
    }

    console.log("Cache MISS");

    const entry = await URL.findOneAndUpdate(
        { shortId },
        {
            $push: {
                visitHistory: {
                    timestamp: Date.now()
                }
            }
        }
    );

    if (!entry) {
        return res.status(404).send("Short URL not found");
    }

    // store in Redis cache
    await redisClient.set(shortId, entry.redirectUrl, {
        EX: 3600
    });

    res.redirect(entry.redirectUrl);
}

module.exports = {
    handleGenerateNewShortURL,
    handleGetAnalytics,
    handleRedirect
};