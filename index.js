const express = require("express");
const path= require("path");
const{connectToMongoDB}= require("./connect");
const urlRoute = require("./routes/url");
const staticRoute=require('./routes/staticRouter')
const {URL} = require("./models/url");
const app = express();


const PORT =8001;

connectToMongoDB('mongodb://localhost:27017/short-url')
.then(() => console.log("MongoDb Connected"));

app.set("view engine", "ejs");// It tells us that my view engine is "ejs"
app.set('views',path.resolve("./views"));// It tells all my ejs files are in Views folder

app.use(express.json());
app.use(express.urlencoded({extended:false}))

app.use("/url", urlRoute);
app.use("/", staticRoute);

app.get('/url/:shortId', async (req, res) => {
    const shortId = req.params.shortId;
    const entry = await URL.findOneAndUpdate({
        shortId
    },{$push:{
        visitHistory:{
            timestamp: Date.now(),
        }
    }})
    res.redirect(entry.redirectUrl);
});

app.listen(PORT, () => console.log(`Server Started at PORT : ${PORT}`));