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
    
    let where = ""
    if(body.search) where = `
    cus_id like '%${body.search}%' or
    cus_fname like '%${body.search}%' or
    cus_lname like '%${body.search}%' or
    cus_phone like '%${body.search}%'
    `
    const getcus = await db("tb_customer")
      .select(
        'cus_id',
        'cus_fname',
        'cus_lname',
        'cus_gender',
        'cus_phone',
        db.raw("DATE_FORMAT(create_date,'%d-%m-%Y %H:%i:%s') as create_date")
      )
      .whereRaw(where)
      .limit(limit)
      .offset(offset)
      .orderBy("id", "desc")??[]
    const countdata = await db('tb_customer').count('id as count').whereRaw(where).first()
    let all_page = Math.ceil(countdata.count/limit)
    let pagination = await paginate(page,all_page)
    if (getcus?.length == 0) return res.render('customer',{
        payload: [],
        username: username,
        item:getcus.length,
        count: getcus.length,
        status: true,
        menu:req.menu,
        pagination:pagination
      })

    if(body.deleted){
      return res.render('customer',{
        payload: getcus,
        username: username,
        item:getcus.length,
        count: getcus.length,
        status: true,
        menu:req.menu,
        pagination:pagination,
        deleted:{msg:body.deleted}
      })
    }
    
    return res.render("customer", {
      payload: getcus,
      username: username,
      item:getcus.length,
      count: getcus.length,
      status: true,
      menu:req.menu,
      pagination:pagination
    });
  } catch (error) {
    console.log(error);
  }
});

router.get("/create", async (req, res) => {
  try {
    res.render('create-cus',{username:req.admin,status:true,menu:req.menu,})
  } catch (error) {
    console.log(error);
  }
});

router.post('/create/insert',async(req,res)=>{
  try {
    const body = req.body
    // console.log('body',body);
    const checkEmp = await db('tb_customer')
    .select('*')
    .whereRaw(`cus_fname = '${body.fname}' and cus_lname = '${body.lname}'`).first()
    if(checkEmp) return res.render('create-cus',{error:true,msg:body.fname+" "+body.lname+' มีอยู่แล้วไม่สามารถสร้างซ้ำได้',status:true,menu:req.menu,}) 
    let address = {
      ship_address:body.ship_address,
      address2:body.address2,
      locality:body.locality,
      state : body.state,
      postcode : body.postcode
    }
    const insertData = await db('tb_customer').insert({
      cus_id:'cus_'+uid(3),
      cus_fname : body.fname,
      cus_lname: body.lname,
      cus_gender:body.gender,
      cus_phone : body.phone,
      cus_email : body.email,
      cus_address : JSON.stringify(address),
      cus_location : ''
    })
    if(!insertData) return render('create-cus',{error:true,msg:'เกิดข้อผิดพลาดบางอย่าง ไม่สามารถเพิ่มลูกค้าได้',status:true})
    return res.render('create-cus',{success:true,msg:'เพิ่มลูกค้า '+body.fname+' '+body.lname+' สำเร็จ',status:true,menu:req.menu,})
  } catch (error) {
    console.log(error);
  }
})

router.get('/edit/:id',async(req,res)=>{
  try {
     const body = req.params 
    //  console.log('body',body);
     const getUser = await db('tb_customer').select(
      'cus_id',
      'cus_fname',
      'cus_lname',
      'cus_gender',
      'cus_email',
      'cus_address',
      'cus_phone',
     ).where({cus_id:body.id}).first()
    //  console.log('getUser',getUser);
     if(getUser.cus_address.length>0) var userAddress = JSON.parse(getUser.cus_address);
    //  return console.log('userAddress',userAddress);
     let payload = {
      cus_id:getUser.cus_id,
      cus_fname:getUser.cus_fname,
      cus_lname: getUser.cus_lname,
      cus_gender: getUser.cus_gender,
      cus_email: getUser.cus_email,
      cus_phone: getUser.cus_phone,
      ship_address:userAddress.ship_address,
      address2: userAddress.address2,
      locality : userAddress.locality,
      state : userAddress.state,
      postcode : userAddress.postcode
     }
    //  return console.log('payload',payload);
     return res.render('edit-cus',{payload:payload,status:true,menu:req.menu,})
  } catch (error) {
    console.log(error);
  }
})

router.post('/edit/update',async(req,res)=>{
  try {
    const body = req.body
    // return console.log('body',body);
    const getUser = await db('tb_customer').select('*').where({cus_id : body.id}).first()
    // console.log('getuser',getUser);
    if(!getUser) return res.render('edit-cus',{error:true,msg:'ไม่พบ',status:true,menu:req.menu,})
    let address = {
      ship_address:body.ship_address,
      address2:body.address2,
      locality:body.locality,
      state : body.state,
      postcode : body.postcode
    }
    let update = {
      cus_id:'cus_'+uid(3),
      cus_fname : body.fname,
      cus_lname: body.lname,
      cus_gender:body.gender,
      cus_phone : body.phone,
      cus_email : body.email,
      cus_address : JSON.stringify(address),
      cus_location : ''
    }
    const updateData = await db('tb_customer').update(update).where({cus_id:body.id})
    let payload = {
      cus_id:body.id,
      cus_fname:body.fname,
      cus_lname: body.lname,
      cus_gender: body.gender,
      cus_email: body.email,
      cus_phone : body.phone,
      ship_address:body.ship_address,
      address2: body.address2,
      locality : body.locality,
      state : body.state,
      postcode : body.postcode
     }
    return res.render('edit-cus',{success:true,msg:'แก้ไขสำเร็จ',status:true,menu:req.menu,payload:payload})
  } catch (error) {
    console.log(error);
  }
})

router.get('/delete/:id',async(req,res)=>{
  try {
    const body = req.params
    // console.log(body);
    const getUser = await db('tb_customer').where({cus_id:body.id}).first()
    // console.log('getUser',getUser);
    if(!getUser){
      let deleted = encodeURIComponent('ไม่พบยูสเซอร์')
      return res.redirect('/customer/?deleted='+deleted)
    }
    if(getUser.level < 1){
      let deleted = encodeURIComponent('ไม่สามารถลบได้')
      return res.redirect('/customer/?deleted='+deleted)
    }
    const deleteUser = await db('tb_customer').where({cus_id:body.id}).del()
    let deleted = encodeURIComponent('ลบข้อมูลสำเร็จ')
    return res.redirect('/customer/?deleted='+deleted)
  } catch (error) {
    console.log(error);
  }
})

module.exports = router;
