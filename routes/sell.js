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
    cus_lname like '%${body.search}%'
    `
    const getdata = await db("tb_order_sell").select(
        'id',
        'order_sell_id',
        db.raw('concat(cus_fname," ",cus_lname) as cus_name'),
        db.raw('(select concat(emp_fname," ",emp_lname) from tb_employee where emp_id = tb_order_sell.emp_id) as emp_name'),
        db.raw(`(select case when emp_position = 'พนักงานขนส่ง' or level < 3 then true else false end from tb_employee where emp_id = tb_order_sell.emp_id) as ship`),
        'order_sell_amount',
        'order_sell_total',
        db.raw("DATE_FORMAT(order_sell_date,'%d-%m-%Y %H:%i:%s') as order_sell_date"),
        db.raw(`case 
        when order_sell_status = 1 then 'กำลังดำเนินงาน' 
        when order_sell_status = 2 then 'กำลังจัดส่ง'
        when order_sell_status = 3 then 'สำเร็จ'
        else 'ยกเลิก' end as order_sell_status`)
      ).whereRaw(where).orderBy("id", "desc").limit(limit).offset(offset)??[]
    const countdata = await db('tb_order_sell').count('id as count').whereRaw(where).first()
    let all_page = Math.ceil(countdata.count/limit)
    let pagination = paginate(page,all_page)

    const getemp = await db('tb_employee').select('*').where({username: req.admin}).first()
    if (getdata?.length == 0) return res.render('sell',{
        payload: [],
        username: username,
        count: getdata.length,
        status: true,
        menu:req.menu,
        item: getdata.length,
        pagination : pagination
      })
    let data = {
      payload: getdata,
      username: username,
      count: getdata.length,
      status: true,
      menu:req.menu,
      item: getdata.length,
      pagination : pagination
    }
    if(getemp.emp_position == 'พนักงานขนส่ง' || getemp.level < 3) data['ship'] = true

    if(body.error){
      data['error'] = {msg:body.error}
    }
    if(body.approve){
      data['approve'] = {msg:body.approve}
    }

    if(body.deleted){
      data['deleted'] = {msg:body.deleted}
    }
    return res.render("sell",data);
  } catch (error) {
    console.log(error);
  }
});

router.get('/create',async(req,res)=>{
    try {
        const getprod = await db('tb_product').select('*').orderBy('id','desc')
        const getcus = await db('tb_customer').select('*').orderBy('id','desc')
       return res.render('create-sell',{
        username:req.admin,
        status:true,
        menu:req.menu,
        product:getprod,
        customer:getcus
      })
    } catch (error) {
        console.log(error);
    }
})

router.post('/insert',async(req,res)=>{
  try {
    const body = req.body
    let prod_id = body.prod_id
    let prod_amount = body.prod_amount
    prod_id.shift()
    prod_amount.shift()

    const order_sell_total = prod_amount.reduce(function(a, b) {return a + parseInt(b)}, 0);
    const getcus = await db('tb_customer').select('*').where({cus_id:body.cus_id}).first()
    const getemp = await db('tb_employee').select('*').where({username : req.admin}).first()
    const sell_id = 'sell_id'+uid(10)
    const insertSell = await db('tb_order_sell').insert({
      order_sell_id : sell_id,
      emp_id:getemp.emp_id,
      cus_id:getcus.cus_id,
      cus_fname:getcus.cus_fname,
      cus_lname:getcus.cus_lname,
      cus_phone:getcus.cus_phone,
      order_sell_amount:prod_id.length,
      order_sell_total:order_sell_total,
      order_sell_date:moment().format('YYYY-MM-DD hh:mm:ss'),
      order_sell_status : 1
    })
    if(!insertSell) return res.redirect('/sell/?error='+encodeURIComponent('เกิดข้อผิดพลาดบางอย่าไม่สามารถเพิ่มได้'))
    for (let index = 0; index < prod_id.length; index++) {
      const id = prod_id[index];
      const amount = prod_amount[index]
      const getprod = await db('tb_product').select('*').where({prod_id:id}).first()
      let sell_price = Number(getprod.prod_price) + (Number(getprod.prod_price)*0.15) 
      const insertDetail = await db('tb_order_sell_detail').insert({
        order_sell_id:sell_id,
        prod_id:getprod.prod_id,
        prod_name:getprod.prod_name,
        prod_price: sell_price,
        prod_amount:amount,
        total:sell_price*Number(amount),
        date:moment().format('YYYY-MM-DD hh:mm:ss'),
      })
    }
    return res.redirect('/sell/?approve='+encodeURIComponent('สร้างรายการสำเร็จ'))
  } catch (error) {
    console.log(error);
  }
})

router.get('/showdata/:id',async(req,res)=>{
  try {
    const body = req.params
    const getorderSell = await db('tb_order_sell').select('*').where({order_sell_id:body.id}).first()
    const getcus = await db('tb_customer').select('*').where({cus_id:getorderSell.cus_id}).first()
    const address = JSON.parse(getcus.cus_address)
    const getdata = await db('tb_order_sell_detail').select(
      'prod_id',
      'prod_name',
      db.raw('format(prod_price,2) as prod_price'),
      'prod_amount',
      db.raw('format(total,2) as total'),
      'total as sum'
    ).where({order_sell_id:body.id})
    if(!getdata){
      let msg = encodeURIComponent('ไม่พบข้อมูล')
      return res.redirect('/sell/?error='+msg)
    }
    let total = getdata.map(x=>x.sum)
    let sum = total.reduce(function(a, b) {
      return a + parseInt(b.replace(",", ""), 10);
    }, 0);
    let vat = sum*0.07
    let totalsum = Number(sum+vat)

    totalsum = Number(totalsum).toLocaleString('en-US', {minimumFractionDigits: 2});
    sum = Number(sum).toLocaleString('en-US', {minimumFractionDigits: 2});
    vat = Number(vat).toLocaleString('en-US', {minimumFractionDigits: 2});
    const today = moment().format('YYYY-MM-DD hh:mm:ss')
    let data ={
      status:true,
      menu:req.menu,
      username:req.admin,
      payload:getdata,
      count:getdata.length,
      id:body.id,
      tax_id:getcus.tax_id,
      cus_name:getorderSell.cus_fname+' '+getorderSell.cus_lname,
      ship_address:address.ship_address??'',
      address2:'ต.'+address.address2??'',
      locality:'อ.'+address.locality??'',
      state:'จ.'+address.state??'',
      postcode:'รหัสไปรษณีย์ '+address.postcode??'',
      sum:sum,
      vat : vat,
      totalsum:totalsum,
      today:today
    }
    if(req.query.error){
      data = {
        status:true,
        menu:req.menu,
        username:req.admin,
        payload:getdata,
        count:getdata.length,
        id:body.id,
        cus_name:getorderSell.cus_fname+' '+getorderSell.cus_lname,
        ship_address:address.ship_address,
        address2:address.address2,
        locality:address.locality,
        state:address.state,
        postcode:address.postcode,
        sum:sum.toLocaleString(),
        vat : vat.toLocaleString(),
        totalsum:totalsum.toLocaleString(),
        error:{msg:req.query.error},
        today:today
      }
    }
    return res.render('showdata-sell',data)
    
  } catch (error) {
    console.log(error);
  }
})

router.get('/print/:id',async(req,res)=>{
  try {
    return res.redirect(`/sell/showdata/${req.params.id}?error=`+encodeURIComponent('ไม่พบเครื่องพิมพ์'))
  } catch (error) {
    console.log(error);
  }
})

router.get('/delete/:id',async(req,res)=>{
  try {
    const body = req.params
    const getUser = await db('tb_order_sell').where({order_sell_id:body.id}).first()
    if(!getUser){
      let deleted = encodeURIComponent('ไม่พบยูสเซอร์')
      return res.redirect('/sell/?deleted='+deleted)
    }
    if(getUser.level > 1){
      let deleted = encodeURIComponent('ไม่สามารถลบได้')
      return res.redirect('/sell/?deleted='+deleted)
    }
    const deleteUser = await db('tb_order_sell').where({order_sell_id:body.id}).del()
    const deleteDetail = await db('tb_order_sell_detail').where({order_sell_id:body.id}).del()
    let deleted = encodeURIComponent('ลบข้อมูลสำเร็จ')
    return res.redirect('/sell/?deleted='+deleted)
  } catch (error) {
    console.log(error);
  }
})

module.exports = router;
