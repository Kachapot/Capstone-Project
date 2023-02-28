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
    const getdata = await db("tb_order_buy as ob")
    .innerJoin('tb_order_buy_detail as obd','obd.order_buy_id','ob.order_buy_id')
      .select(
        db.raw(`
        ob.id,
        ob.order_buy_id,
        concat(emp_fname, " ", emp_lname) as emp_name,
        format(sum(obd.total),2) sumprice,
        format(sum(obd.prod_amount),0) prod_amount,
        DATE_FORMAT(order_buy_date, '%d-%m-%Y %H:%i:%s') as order_buy_date,
        approve_date,
        case
            when order_buy_status = 1 then 'อนุมัติ'
            else 'ยังไม่อนุมัติ'
        end as order_buy_status
        `)
      )
      .whereRaw(where)
      .limit(limit)
      .offset(offset)
      .groupBy('ob.order_buy_id')
      .orderBy("ob.id", "desc")??[]
    const countdata = await db('tb_order_buy').count('id as count').whereRaw(where).first()
    let all_page = Math.ceil(countdata.count/limit)
    let pagination = paginate(page,all_page)
    if (getdata?.length == 0) return res.render('buy',{
        payload: [],
        username: username,
        count: getdata.length,
        status: true,
        menu:req.menu,
        item: getdata.length,
        pagination : pagination
      })
    
    if(body.error){
      return res.render("buy", {
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
      return res.render("buy", {
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
      return res.render("buy", {
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
    return res.render("buy", {
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

router.get('/showdata/:id',async(req,res)=>{
  try {
    const body = req.params
    const getdata = await db('tb_order_buy_detail').select(
      'prod_id',
      'prod_name',
      db.raw("format(prod_price,2) as prod_price"),
      'prod_amount',
      db.raw("format(total,2) as total"),
    ).where({order_buy_id:body.id})
    if(!getdata){
      let msg = encodeURIComponent('ไม่พบข้อมูล')
      return res.redirect('/buy/?error='+msg)
    }
    const total = await db('tb_order_buy_detail')
    .select(db.raw('format(sum(total),2) as total'))
    .where({order_buy_id:body.id}).first()
    return res.render('showdata-buy',{
      status:true,
      menu:req.menu,
      username:req.admin,
      payload:getdata,
      totalPrice:total.total,
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
