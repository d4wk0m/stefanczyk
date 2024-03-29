import slow from "../../../../../Github/slow/index.js";
import formidable from "formidable";
import * as fs from "fs";

import ImageController from "./controllers/ImageController.js";
import UserController from "./controllers/UserController.js";
import { connectDB } from "./data/DB.js";

const app = new slow();
const router = app.router!;

connectDB();

app.registerMiddleware("/images/*", UserController.auth);

router.route("get", "/status", (_req, res) => {
  res.send({ status: "ok" });
});

// posts
router.route("get", "/posts", async (req, res) => {
  const token = req.headers["authorization"]?.split(" ")[1];
  if (!token) {
    return res.send({ ok: false, status: "No token provided" });
  }

  const posts = await ImageController.getPosts(token);

  if (!posts.ok) {
    return res.send({ ok: false, status: posts.status });
  }

  return res.send({ ok: true, status: "ok", posts: posts.posts });
});
router.route("post", "/posts", (req, res) => {
  const form = formidable({
    multiples: true,
    uploadDir: "./uploads",
    keepExtensions: true,
  });
  form.parse(req, async (err, fields, files) => {
    const { description, tags, token } = fields;
    const { images } = files;
    if (err) {
      res.statusCode = 500;
      res.send({ status: err });
      return;
    }
    if (!description) {
      res.statusCode = 400;
      res.send({ status: "No album defined" });
      return;
    }
    if (!tags) {
      res.statusCode = 400;
      res.send({ status: "No tags defined" });
      return;
    }
    if (!token) {
      res.statusCode = 400;
      res.send({ status: "No token defined" });
      return;
    }
    if (!images) {
      res.statusCode = 400;
      res.send({ status: "No image attached" });
      return;
    }

    const auth = await UserController.authenticateUser(token.toString());

    if (!auth) {
      res.statusCode = 401;
      res.send({ status: "Invalid token" });
      return;
    }

    const imageArray = [] as formidable.File[];
    if (images instanceof Array) {
      imageArray.push(...images);
    } else {
      imageArray.push(images);
    }

    const parsedTags = JSON.parse(tags.toString()) as string[];

    ImageController.savePost(
      token.toString(),
      description.toString(),
      parsedTags,
      imageArray
    );
    res.send({ status: "ok" });
  });
});
router.route("post", "/posts/:id/like", async (req, res) => {
  const { id } = req.params;
  const token = req.headers["authorization"]?.split(" ")[1];
  if (!token) {
    return res.send({ ok: false, status: "No token provided" });
  }
  if (!id) {
    return res.send({ ok: false, status: "No id provided" });
  }

  const auth = await UserController.authenticateUser(token.toString());

  if (!auth) {
    res.statusCode = 401;
    res.send({ ok: false, status: "Invalid token" });
    return;
  }

  const like = await ImageController.likePost(token, id.toString());

  if (!like.ok) {
    return res.send({ ok: false, status: like.status });
  }

  return res.send({ ok: true, status: "ok" });
});

// images
router.route("get", "/images/:id", async (req, res) => {
  if (!req.params["id"]) {
    return res.send({ ok: false, status: "No image id provided" });
  }

  const image = await ImageController.getImage(req.params["id"].toString());

  if (!image.ok) {
    return res.send({ ok: false, status: image.status });
  }

  if (!image.image) {
    return res.send({ ok: false, status: "Image not found" });
  }

  const stat = fs.statSync(image.image.path);

  res.writeHead(200, {
    "Content-Type": image.image.contentType,
    "Content-Length": stat.size,
  });

  const readStream = fs.createReadStream(image.image.path);

  readStream.pipe(res);
  return;

  // return res.send({ ok: true, status: "ok" });
});
router.route("get", "/images/:id/preview", async (req, res) => {
  if (!req.params["id"]) {
    return res.send({ ok: false, status: "No image id provided" });
  }

  const image = await ImageController.getPreview(req.params["id"].toString());

  if (!image.ok) {
    return res.send({ ok: false, status: image.status });
  }

  if (!image.previewPath) {
    return res.send({ ok: false, status: "Image not found" });
  }

  const stat = fs.statSync(image.previewPath);

  res.writeHead(200, {
    "Content-Type": "image/webp",
    "Content-Length": stat.size,
  });

  const readStream = fs.createReadStream(image.previewPath);

  readStream.pipe(res);
  return;
});

// users
router.route("post", "/users/signup", async (req, res) => {
  try {
    const { username, email, password, name, surname } = req.body;

    if (!(username && email && password && name && surname)) {
      res.statusCode = 400;
      res.send({ status: "All inputs are required" });
      return;
    }

    const result = await UserController.registerUser({
      username: username.toString(),
      email: email.toString(),
      password: password.toString(),
      name: name.toString(),
      surname: surname.toString(),
    });

    if (result.ok) {
      res.send({ status: "ok", token: result.token });
    } else {
      res.statusCode = 409;
      res.send({ status: result.status });
    }
  } catch (error) {
    res.statusCode = 500;
    res.send({ status: error });
  }
});
router.route("post", "/users/signin", async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!(username && password)) {
      res.statusCode = 400;
      res.send({ status: "All inputs are required" });
      return;
    }

    const result = await UserController.loginUser({
      login: username.toString(),
      password: password.toString(),
    });

    if (result.ok) {
      res.send({ status: "ok", token: result.token });
    } else {
      res.statusCode = 401;
      res.send({ status: result.status });
    }
  } catch (error) {
    res.statusCode = 500;
    res.send({ status: error });
  }
});
router.route("post", "/users/authenticate", async (req, res) => {
  const { token } = req.body;

  if (!token) {
    res.statusCode = 400;
    res.send({ status: "Token is required" });
    return;
  }

  const result = await UserController.authenticateUser(token.toString());

  if (result) {
    const user = await UserController.getUserData(token.toString());
    if (user.ok) {
      res.send({ user: user.user });
    } else {
      res.statusCode = 401;
      res.send({ status: user.status });
    }
  } else {
    res.statusCode = 401;
    res.send({ status: "Invalid token" });
  }
});
router.route("get", "/users", async (_req, res) => {
  const users = await UserController.getAllUsers();

  res.send({ status: "ok", users });
});

app.listen();
