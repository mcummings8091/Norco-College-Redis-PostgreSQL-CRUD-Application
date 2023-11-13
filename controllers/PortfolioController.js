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
      res.status(500).send(err);
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
          // Update the cache with the updated list of items
          await client.set(
            "projectData",
            JSON.stringify(result.rows),
            "EX",
            60 * 60
          );
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
    const cachedData = await client.get("projectData");
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
          await client.set(
            "projectData",
            JSON.stringify(result.rows),
            "EX",
            60 * 60
          );
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
  let sql = `UPDATE projectData
  SET Description = \$1
  WHERE Title = \$2`;
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
          // Update the cache with the updated list of items
          await client.set(
            "projectData",
            JSON.stringify(result.rows),
            "EX",
            60 * 60
          );
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
  let sql = `DELETE FROM projectData
    WHERE Title = \$1`;
  let values = [req.body.title];

  pool.query(sql, values, async (err) => {
    if (err) {
      console.error("Error:", err);
    } else {
      await client.del("projectData");
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
      await client.del("projectData");
      res.render("index", { message: "Table cleared" });
    }
  });
};
