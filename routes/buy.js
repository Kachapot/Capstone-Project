const router = require("express").Router();
const { uid } = require("uid");
const {moment} = require('../module/index')
const {paginate,page_PN} = require('./function')
const db = require("../database/connect");

router.get("/", async (req, res) => {
  try {
    const body = req.query
    const limit = 10
    let page = page_PN(Number(body.page??1),body.pageType??'')
    const offset = (page-1)*limit
    let username = req.admin;
    let where = ''
    if(body.search) where = `
    order_by_id like '%${body.search}%' or 
    emp_fname like '%${body.search}%' or 
    emp_lname like '%${body.search}%' or
    `
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
      .whereRaw(where)
      .limit(limit)
      .offset(offset)
      .orderBy("id", "desc")??[]
    const countdata = await db('tb_order_buy').count('id as count').whereRaw(where).first()
    let all_page = Math.ceil(countdata.count/limit)
    let pagination = await paginate(page,all_page)
    if (getdata?.length == 0) return res.render('buy',{
        payload: [],
        username: username,
        count: getdata.length,
        status: true,
        item: getdata.length,
        pagination : pagination
      })
    
    return res.render("buy", {
      payload: getdata,
      username: username,
      count: getdata.length,
      status: true,
      item: getdata.length,
      pagination : pagination
    });
  } catch (error) {
    console.log(error);
  }
});

module.exports = router;
