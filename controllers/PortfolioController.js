const Item = require("../models/portfolio_item");
const redis = require("redis");
const client = redis.createClient();

client.on("error", function (error) {
  console.error("Redis client error:", error);
});

client.connect().catch(function (error) {
  console.error("Redis client connection error:", error);
});

/* Create Handling */

exports.getCreateForm = (req, res) => {
  res.render("Portfolio_create");
};

exports.createProject = (req, res, pool) => {
  skillsArray = req.body.skills.split(",");
  const projectData = new Item({
    title: req.body.title,
    description: req.body.description,
    skills: skillsArray,
  });

  const sql = `
  INSERT INTO projectData (Title, Description, Skills) 
  VALUES (\$1, \$2, \$3)
    `;

  const values = [projectData.title, projectData.description, skillsArray];

  pool.query(sql, values, async (err, result) => {
    if (err) {
      console.error("Error:", err);
      res.status(500).send("An error occured");
    } else {
      console.log("Project data saved!");
      // Get the updated list of items from the database
      const sql = `
        SELECT * FROM projectData
        `;
      pool.query(sql, [], async (err, result) => {
        if (err) {
          console.error("Error:", err);
        } else {
          // Update Cache and log errors
          await client
            .set("projectData", JSON.stringify(result.rows), "EX", 60 * 60)
            .catch(function (error) {
              console.error("Redis client set error:", error);
            });
          res.render("index", { message: "Project Data Saved!" });
        }
      });
    }
  });
};

/* End Create Handling */

/* Read Handling */

exports.getItems = async (req, res, pool) => {
  try {
    const cachedData = await client.get("projectData").catch(function (error) {
      console.error("Redis client get error:", error);
    });
    if (cachedData) {
      res.render("portfolio_list", { projectData: JSON.parse(cachedData) });
    } else {
      const sql = `
        SELECT * FROM projectData
        `;
      pool.query(sql, [], async (err, result) => {
        if (err) {
          console.error("Error:", err);
        } else {
          await client
            .set("projectData", JSON.stringify(result.rows), "EX", 60 * 60)
            .catch(function (error) {
              console.error("Redis client set error:", error);
            });
          res.render("portfolio_list", { projectData: result.rows });
        }
      });
    }
  } catch (error) {
    console.error("Error:", error);
  }
};
/* End Read Handling */

/* Update Handling */

exports.getUpdateForm = (req, res) => {
  res.render("portfolio_update");
};

exports.updateItem = (req, res, pool) => {
  const sanitize = "Title";
  let sql = `UPDATE projectData
  SET Description = \$1
  WHERE ${sanitize} = \$2`;
  let values = [req.body.description, req.body.title];

  pool.query(sql, values, async (err) => {
    if (err) {
      console.error("Error:", err);
    } else {
      console.log(`Row(s) updated: ${req.body.title}`);
      // Get the updated list of items from the database
      const sql = `
        SELECT * FROM projectData
        `;
      pool.query(sql, [], async (err, result) => {
        if (err) {
          console.error("Error:", err);
        } else {
          await client
            .set("projectData", JSON.stringify(result.rows), "EX", 60 * 60)
            .catch(function (error) {
              console.error("Redis client set error:", error);
            });
          res.render("index", { message: `Row(s) updated: ${req.body.title}` });
        }
      });
    }
  });
};

/* End Update Handling */

/* Delete Handling */

exports.getDeleteForm = (req, res) => {
  res.render("portfolio_delete");
};

exports.deleteItem = (req, res, pool) => {
  const sanitize = "Title";
  let sql = `DELETE FROM projectData
    WHERE ${sanitize} = \$1`;
  let values = [req.body.title];

  pool.query(sql, values, async (err) => {
    if (err) {
      console.error("Error:", err);
    } else {
      // Clear the cache
      await client.del("projectData").catch(function (error) {
        console.error("Redis client del error:", error);
      });
      console.log(`Item deleted: ${req.body.title}`);
      res.render("index", { message: `Item deleted: ${req.body.title}` });
    }
  });
};

exports.deleteAllItems = (req, res, pool) => {
  let deleterows = `DELETE FROM projectData`;

  pool.query(deleterows, async (err) => {
    if (err) {
      console.error("Error:", err);
    } else {
      console.log("Table Cleared");
      // Clear the cache
      await client.del("projectData").catch(function (error) {
        console.error("Redis client del error:", error);
      });
      res.render("index", { message: "Table cleared" });
    }
  });
};
