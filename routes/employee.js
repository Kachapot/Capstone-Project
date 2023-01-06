const router = require("express").Router();
const { uid } = require("uid");
const db = require("../database/connect");

router.get("/", async (req, res) => {
  try {
    // console.log('tb_employee');
    const getEmp = await db("tb_employee")
      .select(
        'emp_id',
        'emp_fname',
        'emp_lname',
        'emp_position',
        'emp_status',
        db.raw("DATE_FORMAT(create_date,'%d-%m-%Y %H:%i:%s') as create_date")
      )
      .whereRaw("level > 1")
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

router.post('/create/insert',async(req,res)=>{
  try {
    const body = req.body
    console.log('body',body);
    const checkEmp = await db('tb_employee')
    .select('*')
    .whereRaw(`username = '${body.username}'`).first()
    if(checkEmp) return res.render('create-emp',{error:true,msg:body.username+" มีผู้ใช้งานแล้ว",status:true}) 
    const insertData = await db('tb_employee').insert({
      emp_id:'emp_'+uid(3),
      username: body.username,
      password: body.password,
      emp_fname : body.fname,
      emp_lname: body.lname,
      emp_position: body.position,
      level: 3,
      emp_status:1,
      emp_gender : body.gender,
      emp_birthday : body.birthdate,
      emp_email: body.email,
      emp_address: body.address,
      emp_img : '',
      emp_phone: body.phone
    })
    if(!insertData) return render('create-emp',{error:true,msg:'เกิดข้อผิดพลาดบางอย่าง ไม่สามารถเพิ่มพนักงานได้',status:true})
    return res.render('create-emp',{success:true,msg:'เพิ่มพนักงาน '+body.fname+' '+body.lname+' สำเร็จ',status:true})
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
      ''
     ).where({emp_id:body.id})
    //  console.log('getUser',getUser);
     return res.render('edit-emp',{payload:getUser,status:true})
  } catch (error) {
    console.log(error);
  }
})

module.exports = router;
