const jwt = require("jsonwebtoken");
const db = require('../database/connect')
const fileUpload = require('express-fileupload')

exports.fileMiddle = fileUpload({
  limits: { fileSize: 5000_000 },// 5MB
  useTempFiles: true,
  tempFileDir: '../upload_tmp/',
  createParentPath: true,
  uriDecodeFileNames: true,
  abortOnLimit: true,
  responseOnLimit: 'ขนาดไฟล์เกิน 5MB'
});

module.exports.authorization = async (req,res,next)=>{ 
  const token = req.cookies?.access_token;
  if (!token) {
    return res.render('login')
  }
  try {
    const data = jwt.verify(token,'adminsystem');
    const getlog = await db.select('iat').from('tb_log_login').where({username:data.username}).orderBy('id','desc').limit(1)
    if (getlog[0].iat != data.iat) {
      let data = {status:true,message:"token not valide",data:""}
      return res.clearCookie("access_token").render('login',data)
    }
    const getadmin = await db('tb_employee').select('emp_position as position').where({username:data.username}).first()
    let menu = [{
      dashboard:true,
      sell:true,
      emp:true,
      cus:true,
      prod:true,
      buy:true,
      sell:true,
    }]
    if(data.level == 1){
      menu = menu
    }else if(data.level == 2){
      menu = [{
        sell:true,
        emp:true,
        cus:true,
        prod:true,
        // buy:true
      }]
    }else if(data.level == 3){
      if(getadmin.position == 'พนักงานทั่วไป' || getadmin.position == 'general'){
        menu = [{
          // sell:true,
          // emp:true,
          // cus:true,
          prod:true,
          // buy:true
        }]
      }else if(getadmin.position == 'พนักงานคิดเงิน' || getadmin.position == 'cashier'){
        menu = [{
          sell:true,
          // emp:true,
          cus:true,
          prod:true,
          // buy:true
        }]
      }else if(getadmin.position == 'พนักงานขนส่ง' || getadmin.position == 'delivery'){
        menu = [{
          sell:true,
          // emp:true,
          // cus:true,
          // prod:true,
          // buy:true
        }]
      }
      
    }
    req.menu = menu
    req.admin = data.username;
    req.level = data.level
    req.position = getadmin.position
    return next();
  } catch (err) {
    console.log(err);
    return res.status(403).json({ status: 400, message: "catch", data: {} });
  }
}

