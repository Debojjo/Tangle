const express = require('express');
const app = express();
const userModel = require("./models/user");
const postModel = require("./models/post");
const cookieParser = require('cookie-parser');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const path = require('path');
const upload = require("./utils/multerconfig");


app.set("view engine", "ejs");
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, "public")));

app.get("/", function (req, res) {
  res.render("index");
})


app.get("/profile/upload", function (req, res) {
  res.render("profileupload");
})

app.post("/upload", isLoggedIn, upload.single('image'), async function (req, res) {

  let user = await userModel.findOne({ email: req.user.email});
  user.profilepic = req.file.filename;
  await user.save()
  res.redirect("/profile");
})


app.get("/login", function (req, res) {
  res.render("login");
})

app.get("/profile", isLoggedIn, async function (req, res) {
  let user = await userModel.findOne({ email: req.user.email }).populate("posts");

  res.render("profile", { user });
})

app.get("/like/:id", isLoggedIn, async function (req, res) {
  let post = await postModel.findOne({ _id: req.params.id }).populate("user");

  if (post.likes.indexOf(req.user.userid) === -1) {
    post.likes.push(req.user.userid);
  }

  const unlikeIndex = post.unlikes.indexOf(req.user.userid);
  if (unlikeIndex !== -1) {
    post.unlikes.splice(unlikeIndex, 1);
  }

  await post.save();
  res.redirect("/profile");
})

app.get("/unlike/:id", isLoggedIn, async function (req, res) {
  let post = await postModel.findOne({ _id: req.params.id }).populate("user");

  if (post.unlikes.indexOf(req.user.userid) === -1) {
    post.unlikes.push(req.user.userid);
  }

  const likeIndex = post.likes.indexOf(req.user.userid);
  if (likeIndex !== -1) {
    post.likes.splice(likeIndex, 1);
  }


  await post.save();
  res.redirect("/profile");
})

app.get("/edit/:id", isLoggedIn, async function (req, res) {
  let post = await postModel.findOne({ _id: req.params.id }).populate("user");

  res.render("edit", { post });
})

app.post("/update/:id", isLoggedIn, async function (req, res) {
  let post = await postModel.findOneAndUpdate({ _id: req.params.id }, { content: req.body.content });

  res.redirect("/profile");
})


app.post("/post", isLoggedIn, async function (req, res) {
  let user = await userModel.findOne({ email: req.user.email });
  let { content } = req.body;

  let post = await postModel.create({
    user: user._id,
    content
  })

  user.posts.push(post._id);
  await user.save();
  res.redirect("/profile");
})

app.post("/register", async function (req, res) {
  let { email, username, name, password, age } = req.body;

  let user = await userModel.findOne({ email })
  if (user) return res.status(300).send("Already registered");

  bcrypt.genSalt(10, (err, salt) => {
    bcrypt.hash(password, salt, async (err, hash) => {
      let user = await userModel.create({
        username,
        email,
        name,
        age,
        password: hash
      });

      let token = jwt.sign({ email: email, userid: user._id }, "shhhh");
      res.cookie("token", token);
      res.send("Registered");
    })
  })


});

app.post("/login", async function (req, res) {
  let { email, password } = req.body;

  let user = await userModel.findOne({ email });
  if (!user) return res.status(300).send("Something went wrong!");

  bcrypt.compare(password, user.password, function (err, result) {
    if (result) {
      let token = jwt.sign({ email: email, userid: user._id }, "shhhh");
      res.cookie("token", token);
      res.status(200).redirect("/profile");
    }
    else res.redirect("/login");
  })


});

app.get("/logout", async function (req, res) {
  res.cookie("token", "");
  res.redirect("/login");
});

function isLoggedIn(req, res, next) {
  if (req.cookies.token === "") res.redirect("/login");
  else {
    let data = jwt.verify(req.cookies.token, "shhhh");
    req.user = data;
    next();
  }
}

app.listen(3000);