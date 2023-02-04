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
    order_sell_id like '%${body.search}%' or 
    cus_fname like '%${body.search}%' or 
    cus_lname like '%${body.search}%' or
    `
    const getdata = await db("tb_order_sell")
      .select(
        'id',
        'order_sell_id',
        db.raw('concat(cus_fname," ",cus_lname) as cus_name'),
        'order_sell_amount',
        'order_sell_total',
        db.raw("DATE_FORMAT(order_sell_date,'%d-%m-%Y %H:%i:%s') as order_sell_date"),
        db.raw(`case when order_sell_status = 1 then 'อนุมัติ' else 'ยังไม่อนุมัติ' end as order_sell_status`)
      )
      .whereRaw(where)
      .limit(limit)
      .offset(offset)
      .orderBy("id", "desc")??[]
    const countdata = await db('tb_order_sell').count('id as count').whereRaw(where).first()
    let all_page = Math.ceil(countdata.count/limit)
    let pagination = await paginate(page,all_page)
    if (getdata?.length == 0) return res.render('sell',{
        payload: [],
        username: username,
        count: getdata.length,
        status: true,
        menu:req.menu,
        item: getdata.length,
        pagination : pagination
      })
    
    if(body.error){
      return res.render("sell", {
        payload: getdata,
        username: username,
        count: getdata.length,
        status: true,
        menu:req.menu,
        item: getdata.length,
        pagination : pagination,
        error:{msg:body.error}
      });
    }
    if(body.approve){
      return res.render("sell", {
        payload: getdata,
        username: username,
        count: getdata.length,
        status: true,
        menu:req.menu,
        item: getdata.length,
        pagination : pagination,
        approve:{msg:body.approve}
      });
    }

    if(body.deleted){
      return res.render("sell", {
        payload: getdata,
        username: username,
        count: getdata.length,
        status: true,
        menu:req.menu,
        item: getdata.length,
        pagination : pagination,
        deleted:{msg:body.deleted}
      });
    }
    return res.render("sell", {
      payload: getdata,
      username: username,
      count: getdata.length,
      status: true,
      menu:req.menu,
      item: getdata.length,
      pagination : pagination
    });
  } catch (error) {
    console.log(error);
  }
});

router.get('/create',async(req,res)=>{
    try {
        res.render('create-sell',{username:req.admin,status:true,menu:req.menu})
    } catch (error) {
        console.log(error);
    }
})

router.get('/showdata/:id',async(req,res)=>{
  try {
    const body = req.params
    const getdata = await db('tb_order_buy_detail').select(
      'prod_id',
      'prod_name',
      'prod_price',
      'prod_amount',
      'total',
    ).where({order_buy_id:body.id})
    if(!getdata){
      let msg = encodeURIComponent('ไม่พบข้อมูล')
      return res.redirect('/buy/?error='+msg)
    }
    return res.render('showdata-buy',{
      status:true,
      menu:req.menu,
      username:req.admin,
      payload:getdata,
      count:getdata.length,
      id:body.id
    })
  } catch (error) {
    console.log(error);
  }
})

router.get('/approve/:id',async(req,res)=>{
  try {
    const body = req.params
    const update = await db('tb_order_buy')
    .update({
      order_buy_status:true,
      approve_date:moment().format("DD-MM-YYYY hh:mm:ss")
    })
    .where({order_buy_id:body.id})
    let msg = encodeURIComponent('อนุมัติสำเร็จ')
    return res.redirect('/buy/?approve='+msg)
  } catch (error) {
    console.log(error);
  }
})

router.get('/delete/:id',async(req,res)=>{
  try {
    const body = req.params
    // console.log(body);
    const getUser = await db('tb_order_buy').where({order_buy_id:body.id}).first()
    // console.log('getUser',getUser);
    if(!getUser){
      let deleted = encodeURIComponent('ไม่พบยูสเซอร์')
      return res.redirect('/buy/?deleted='+deleted)
    }
    if(getUser.level < 1){
      let deleted = encodeURIComponent('ไม่สามารถลบได้')
      return res.redirect('/buy/?deleted='+deleted)
    }
    const deleteUser = await db('tb_order_buy').where({order_buy_id:body.id}).del()
    const deleteDetail = await db('tb_order_buy_detail').where({order_buy_id:body.id}).del()
    let deleted = encodeURIComponent('ลบข้อมูลสำเร็จ')
    return res.redirect('/buy/?deleted='+deleted)
  } catch (error) {
    console.log(error);
  }
})

module.exports = router;
