const router = require("express").Router();
const { uid } = require("uid");
const {moment} = require('../module/index')
const {paginate,page_PN,fileMiddle} = require('./function')
const db = require("../database/connect");

router.get("/", async (req, res) => {
  try {
    const body = req.query
    const limit = 10
    let page = page_PN(Number(body.page??1),body.pageType??'')
    const offset = (page-1)*limit
    let username = req.admin;
    let where = "level > 1 "
    if(body.search) where += `and emp_id like '%${body.search}%' or emp_fname like '%${body.search}%' or emp_lname like '%${body.search}%' or  emp_position like '${body.search}'`
    const getEmp = await db("tb_employee")
      .select(
        'emp_id',
        'emp_fname',
        'emp_lname',
        'emp_position',
        db.raw("DATE_FORMAT(create_date,'%d-%m-%Y %H:%i:%s') as create_date")
      )
      .whereRaw(where)
      .limit(limit)
      .offset(offset)
      .orderBy("id", "desc")??[]
    const countdata = await db('tb_employee').count('id as count').whereRaw(where).first()
    let all_page = Math.ceil(countdata.count/limit)
    let pagination = await paginate(page,all_page)

    if(body.deleted){
      return res.render("employee", {
        payload: getEmp,
        username: username,
        item:getEmp.length,
        count: countdata.count,
        status: true,
        menu:req.menu,
        pagination:pagination,
        deleted:{deleted:true,msg:body.deleted}
      });
    }

    return res.render("employee", {
      payload: getEmp,
      username: username,
      item:getEmp.length,
      count: countdata.count,
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
    res.render('create-emp',{username:req.admin,status:true,menu:req.menu,})
  } catch (error) {
    console.log(error);
  }
});

router.post('/create/insert',fileMiddle,async(req,res)=>{
  try {
    const body = req.body
    // console.log('body',body)
    // console.log('file',req?.files?.profileimg);
    const checkEmp = await db('tb_employee')
    .select('*')
    .whereRaw(`username = '${body.username}'`).first()

    // if(req.files.length > 0){
      let BannerFileName = 'public/images/'+req.files.profileimg.name
      await req.files.profileimg.mv(BannerFileName,async(err)=>{})
    // }
    if(checkEmp) return res.render('create-emp',{error:true,msg:body.username+" มีผู้ใช้งานแล้ว",status:true,menu:req.menu,}) 

    let birthdate = body.birthdate
    let editbirthdate = birthdate.replace(/\//g, '-');
    const insertData = await db('tb_employee').insert({
      emp_id:'emp_'+uid(3),
      username: body.username,
      password: body.password,
      emp_fname : body.fname,
      emp_lname: body.lname,
      emp_position: body.position,
      level: 3,
      emp_gender : body.gender,
      emp_birthday :editbirthdate,
      emp_email: body.email,
      emp_address: body.address,
      emp_img :BannerFileName,
      emp_phone: body.phone
    })
    if(!insertData) return render('create-emp',{error:true,msg:'เกิดข้อผิดพลาดบางอย่าง ไม่สามารถเพิ่มพนักงานได้',status:true,menu:req.menu,})
    return res.render('create-emp',{success:true,msg:'เพิ่มพนักงาน '+body.fname+' '+body.lname+' สำเร็จ',status:true,menu:req.menu,})
  } catch (error) {
    console.log(error);
  }
})

router.get('/edit/:id',async(req,res)=>{
  try {
     const body = req.params
    //  console.log('body',body);
     const getUser = await db('tb_employee').select(
      'emp_id',
      'emp_fname',
      'emp_lname',
      'username',
      'password',
      'emp_position',
      'level',
      'emp_gender',
      'emp_email',
      'emp_address',
      'emp_img',
      'emp_phone',
      db.raw("date_format(emp_birthday, '%Y-%m-%d') as emp_birthday")
     ).where({emp_id:body.id})
    //  console.log('getUser',getUser);
     if(req.query.edit) return res.render('edit-emp',{payload:getUser,status:true,menu:req.menu,msg:'แก้ไขสำเร็จ',success:true})
     return res.render('edit-emp',{payload:getUser,status:true,menu:req.menu,})
  } catch (error) {
    console.log(error);
  }
})

router.post('/edit/update',async(req,res)=>{
  try {
    const body = req.body
    // console.log('body',body);
    const getUser = await db('tb_employee').select(
      'username',
      'password',
      'emp_fname',
      'emp_lname',
      'emp_gender',
      'emp_position',
      'level',
      'emp_gender',
      'emp_email',
      'emp_address',
      'emp_img',
      'emp_phone',
      db.raw("date_format(emp_birthday, '%d-%m-%Y') as emp_birthday")
      ).where({emp_id : body.id}).first()
    if(!getUser) return res.render('edit-emp',{error:true,msg:'ไม่พบ',status:true,menu:req.menu,})
    let update = {
      username:body.username??getUser.username,
      password:body.password??getUser.password,
      emp_fname:body.fname??getUser.emp_fname,
      emp_lname:body.lname??getUser.emp_lname,
      emp_gender:body.gender??getUser.emp_gender,
      emp_position:body.position??getUser.emp_position,
      emp_phone : body.phone??getUser.emp_phone,
      emp_email:body.email??getUser.emp_email,
      emp_birthday:body.birthdate??getUser.emp_birthday,
      emp_address:body.address??getUser.emp_address,
    }
    // console.log('update',update);
    const updateData = await db('tb_employee').update(update).where({emp_id:body.id})
    return res.redirect('/employee/edit/'+body.id+"?edit="+encodeURIComponent(true))
  } catch (error) {
    console.log(error);
  }
})

router.get('/showdata/:id',async(req,res)=>{
  try {
    const body = req.params 
    const getUser = await db('tb_employee').select(
      'emp_id',
      'emp_fname',
      'emp_lname',
      'username',
      'emp_position',
      'level',
      'emp_gender',
      'emp_email',
      'emp_address',
      'emp_img',
      'emp_phone',
      db.raw("date_format(emp_birthday, '%d-%m-%Y') as emp_birthday")
     ).where({emp_id:body.id})
     return res.render('showdata-emp',{
      username:req.admin,
      status:true,
      menu:req.menu,
      payload:getUser
     })
  } catch (error) {
    console.log(error);
  }
})

router.get('/delete/:id',async(req,res)=>{
  try {
    const body = req.params
    // console.log(body);
    const getUser = await db('tb_employee').where({emp_id:body.id}).first()
    // console.log('getUser',getUser);
    if(!getUser){
      let deleted = encodeURIComponent('ไม่พบยูสเซอร์')
      return res.redirect('/employee/?deleted='+deleted)
    }
    if(getUser.level < 1){
      let deleted = encodeURIComponent('ไม่สามารถลบได้')
      return res.redirect('/employee/?deleted='+deleted)
    }
    const deleteUser = await db('tb_employee').where({emp_id:body.id}).del()
    let deleted = encodeURIComponent('ลบข้อมูลสำเร็จ')
    return res.redirect('/employee/?deleted='+deleted)
  } catch (error) {
    console.log(error);
  }
})

module.exports = router;
