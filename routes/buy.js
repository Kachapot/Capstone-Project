const router = require("express").Router();
const { uid } = require("uid");
const {moment} = require('../module/index')
const db = require("../database/connect");

router.get("/", async (req, res) => {
  try {
    // console.log('customer');
    username = req.admin;
    const getdata = await db("tb_order_buy")
      .select(
        'id',
        'order_buy_id',
        db.raw('concat(emp_fname," ",emp_lname) as emp_name'),
        'order_buy_amount',
        'order_buy_total',
        db.raw("DATE_FORMAT(order_buy_date,'%d-%m-%Y %H:%i:%s') as order_buy_date"),
        db.raw("DATE_FORMAT(approve_date,'%d-%m-%Y %H:%i:%s') as approve_date"),
        db.raw(`case when order_buy_status = 1 then 'อนุมัติ' else 'ยังไม่อนุมัติ' end as order_buy_status`)
      )
      .orderBy("id", "desc");
    //   console.log('getdata',getdata);
    if (getdata?.length == 0) return res.render('buy',{
        payload: [],
        username: username,
        count: getdata.length,
        status: true,
      })
    
    return res.render("buy", {
      payload: getdata,
      username: username,
      count: getdata.length,
      status: true,
    });
  } catch (error) {
    console.log(error);
  }
});

module.exports = router;
