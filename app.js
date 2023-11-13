// 9f47c2ac671398eec8e7231253b8387ac7794ada50797d253f7aff1f2b565ad5
const express = require("express");
const { Pool } = require("pg");
const bodyParser = require("body-parser");
const PortfolioController = require("./controllers/PortfolioController");

PORT = 8080;

const app = express();
const router = express.Router();

app.set("view engine", "ejs");

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(__dirname + "/public"));
app.use(router);

const pool = new Pool({
  user: "postgres",
  host: "localhost",
  database: "postgres",
  password: "8091061T@",
  port: 5432,
});

const createProjectTable = `
    CREATE TABLE IF NOT EXISTS projectData (
        ID SERIAL PRIMARY KEY,
        Title TEXT,
        Description TEXT,
        Skills TEXT[]
    );
`;

pool.query(createProjectTable, (err, res) => {
  if (err) {
    console.error(err);
    return;
  }
  console.log("Table created successfully");
});

/*
const dropProjectTable = `
  DROP TABLE IF EXISTS projectData;
`;

pool.query(dropProjectTable, (err, res) => {
  if (err) {
    console.error(err);
    return;
  }
  console.log("Table dropped successfully");
});
*/

app.get("/", (req, res) => {
  res.render("index", { message: "" });
});

/* Create */

router.get("/create", PortfolioController.getCreateForm);
router.post("/create", (req, res) =>
  PortfolioController.createProject(req, res, pool)
);

/* End Create */

/* Read */

router.get("/read", (req, res) => PortfolioController.getItems(req, res, pool));

/* End Read */

/* Update */

router.get("/update", PortfolioController.getUpdateForm);

router.post("/update", (req, res) =>
  PortfolioController.updateItem(req, res, pool)
);

/*  End Update */

/* Delete */

router.get("/delete", PortfolioController.getDeleteForm);

router.post("/delete", (req, res) =>
  PortfolioController.deleteItem(req, res, pool)
);

router.post("/drop", (req, res) =>
  PortfolioController.deleteAllItems(req, res, pool)
);

/* End Delete */

app.listen(PORT, () => {
  console.log(`listening at http://localhost:${PORT}`);
});
