// Dependencies
var express = require("express");
var bodyParser = require("body-parser");
var logger = require("morgan");
var mongoose = require("mongoose");
var path = require("path");

// Requiring Note and Article models
var Note = require("./models/note.js");
var article = require("./models/article.js");

// Scraping
var request = require("request");
var cheerio = require("cheerio");

var MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost/mongoscraper";

mongoose.Promise = Promise;
mongoose.connect(MONGODB_URI);

// Port
var port = process.env.PORT || 3000

// Express
var app = express();

// Use morgan and body parser with our app
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

app.use(express.static("public"));

// Handlebars.
var exphbs = require("express-handlebars");

app.engine("handlebars", exphbs({
    defaultLayout: "main",
    partialsDir: path.join(__dirname, "/views/layouts/partials")
}));
app.set("view engine", "handlebars");

mongoose.connect("mongodb://localhost/mongoscraper");
var db = mongoose.connection;

// Mongoose Errors
db.on("error", function(error) {
  console.log("Mongoose Error: ", error);
});

// Log a message once the connection goes through
db.once("open", function() {
  console.log("Mongoose connection established.");
});

// Routes
// ======

//GET handlebar pages
app.get("/", function(req, res) {
  article.find({"saved": false}, function(error, data) {
    var hbsObject = {
      article: data
    };
    console.log(hbsObject);
    res.render("home", hbsObject);
  });
  // res.send("hello");
});

app.get("/saved", function(req, res) {
  article.find({"saved": true}).populate("note").exec(function(error, articles) {
    var hbsObject = {
      article: articles
    };
    res.render("saved", hbsObject);
  });
});

app.get("/scrape", function(req, res) {
  request("https://www.nytimes.com/", function(error, response, html) {
    var $ = cheerio.load(html);
    $("article").each(function(i, element) {

      var result = {};

      result.title = $(this).children("h2").text();
      result.summary = $(this).children(".summary").text();
      result.link = $(this).children("h2").children("a").attr("href");

      var entry = new Article(result);

      entry.save(function(err, doc) {
        // Log all errors
        if (err) {
          console.log(err);
        }
        // Or log the document
        else {
          console.log(doc);
        }
      });

    });
        res.send("Scraping Complete");

  });
});

// This will get the articles that were scraped from the mongoDB
app.get("/articles", function(req, res) {
  article.find().sort({ _id: 1 }).limit(5, function(error, doc) {
    // Log any errors
    if (error) {
      console.log(error);
    }
    else {
      res.json(doc);
    }
  });
});

// Grab an article by the ID
app.get("/articles/:id", function(req, res) {
  article.findOne({ "_id": req.params.id })
  .populate("note")
  .exec(function(error, doc) {
    if (error) {
      console.log(error);
    }
    else {
      res.json(doc);
    }
  });
});


// Save the article
app.post("/articles/save/:id", function(req, res) {
      article.findOneAndUpdate({ "_id": req.params.id }, { "saved": true})
      .exec(function(err, doc) {
        if (err) {
          console.log(err);
        }
        else {
          res.send(doc);
        }
      });
});

// Deleting an article
app.post("/articles/delete/:id", function(req, res) {
      article.findOneAndUpdate({ "_id": req.params.id }, {"saved": false, "note": []})
      .exec(function(err, doc) {
        if (err) {
          console.log(err);
        }
        else {
          res.send(doc);
        }
      });
});

// Creating Notes
app.post("/note/save/:id", function(req, res) {
  var newNote = new Note({
    body: req.body.text,
    article: req.params.id
  });
  console.log(req.body)
  newNote.save(function(error, note) {
    // Log any errors
    if (error) {
      console.log(error);
    }
    // Otherwise
    else {
      // Use the article id to find and update it's notes
      article.findOneAndUpdate({ "_id": req.params.id }, {$push: { "note": note } })
      .exec(function(err) {
        if (err) {
          console.log(err);
          res.send(err);
        }
        else {
          res.send(note);
        }
      });
    }
  });
});

// Deleting Notes
app.delete("/note/delete/:note_id/:article_id", function(req, res) {
  Note.findOneAndRemove({ "_id": req.params.note_id }, function(err) {
    if (err) {
      console.log(err);
      res.send(err);
    }
    else {
      article.findOneAndUpdate({ "_id": req.params.article_id }, {$pull: {"note": req.params.note_id}})
        .exec(function(err) {
          if (err) {
            console.log(err);
            res.send(err);
          }
          else {
            res.send("Note Deleted");
          }
        });
    }
  });
});

// Listen on port
app.listen(port, function() {
  console.log("App running on port " + port);
});