const router = require("express").Router();
const db = require("../database/connect");

router.get("/", async (req, res) => {
  try {
    const getEmp = await db("admin")
      .select("*")
      .where({ type: "employee" })
      .orderBy("id", "desc");
    if (getEmp?.length == 0) return (payload = []);
    let count = getEmp.length;
    username = req.admin;
    return res.render("employee", {
      payload: getEmp,
      username: username,
      count: count,
      status: true,
    });
  } catch (error) {
    console.log(error);
  }
});

router.get("/create", async (req, res) => {
  try {
    res.render('create-emp',{username:req.admin,status:true})
  } catch (error) {
    console.log(error);
  }
});

module.exports = router;
