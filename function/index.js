const jwt = require("jsonwebtoken");
const db = require('../database/connect')
const fileUpload = require('express-fileupload')
const escapeHtml = require('escape-html');

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
  // console.log('token',req.cookies);
  if (!token) {
    // console.log('!token');
    return res.render('login')
  }
  try {
    const data = jwt.verify(token,'adminsystem');
    const getlog = await db.select('iat').from('tb_log_login').where({username:data.username}).orderBy('id','desc').limit(1)
    if (getlog[0].iat != data.iat) {
      let data = {status:true,message:"token not valide",data:""}
      return res.clearCookie("access_token").render('login',data)
        // .status(401)
        // .json({ status: 400, message: "Token Timeout", data: {} });
    }
    // console.log('token passed!');
    let menu
    if(data.level == 1){
      menu = `
      <div class="offcanvas-body">
        <ul class="navbar-nav justify-content-end flex-grow-1 pe-3">
          <li class="nav-item">
            <a class="nav-link" href="/main"><h4>รายการสั่งซื้อ</h4></a>
          </li>
          <li class="nav-item">
            <a class="nav-link" href="/employee"><h4>รายชื่อพนักงาน</h4></a>
          </li>
          <li class="nav-item">
            <a class="nav-link" href="/customer"><h4>รายชื่อลูกค้า</h4></a>
          </li>
          <li class="nav-item">
            <a class="nav-link" href="/product"><h4>รายการคลังสินค้า</h4></a>
          </li>
          <li class="nav-item">
            <a class="nav-link" href="/buy"><h4>รายการใบสั่งซื้อสินค้า</h4></a>
          </li>
        </ul>
      </div>
      `
    }else if(data.level == 2){

    }else if(data.level == 3){

    }else{
      menu = `
      <div class="offcanvas-body">
        <ul class="navbar-nav justify-content-end flex-grow-1 pe-3">
          <li class="nav-item">
            <a class="nav-link" href="/main"><h4>รายการสั่งซื้อ</h4></a>
          </li>
          <li class="nav-item">
            <a class="nav-link" href="/employee"><h4>รายชื่อพนักงาน</h4></a>
          </li>
          <li class="nav-item">
            <a class="nav-link" href="/customer"><h4>รายชื่อลูกค้า</h4></a>
          </li>
          <li class="nav-item">
            <a class="nav-link" href="/product"><h4>รายการคลังสินค้า</h4></a>
          </li>
          <li class="nav-item">
            <a class="nav-link" href="/buy"><h4>รายการใบสั่งซื้อสินค้า</h4></a>
          </li>
        </ul>
      </div>
      `
    }
    req.menu = menu
    req.admin = data.username;
    return next();
  } catch (err) {
    console.log(err);
    return res.status(403).json({ status: 400, message: "catch", data: {} });
  }
}

