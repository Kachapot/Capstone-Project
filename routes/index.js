const router = require('express').Router();
const {authorization,login} = require('../function/index')
const {useragent,moment,jwt} = require('../module/index')
const db = require('../database/connect')

router.get('/',authorization,(req,res)=>{
    // console.log('cookie',req);
    if(req.cookies?.access_token){
      res.redirect('/main')
    }else{
      res.render('login')
    }
})

router.get('/main',authorization,async(req,res)=>{
  try {
    let data = {status:true,msg:"welcome",username:req.admin}
    res.render('index',data)
  } catch (error) {
    console.log(error);
    return res.status(401)
  }
})

router.post('/login',async (req,res)=>{
    try {
        console.log('login');
        const body = req.body
        console.log('username',body.username);
        console.log('password',body.password);
        const getadmin = await db('admin').select('*').first()
        console.log('getadmin',getadmin);
        if (!getadmin || getadmin?.status != 1) {
            let data = ({ status: 400, message: "บัญขีถูกระงับ"});
            return res.redirect('/')
        }
        //   const compare = await bcrypt.compare(
        //     body.password,
        //     getadmin[0].password
        //   );
        //   if (compare) {
            var header = req.headers["user-agent"];
            let ua = useragent.parse(header);
            var browser = ua.browser;
            var platform = ua.platform;
            var ip_address = (ipadd =
              req.headers["cf-connecting-ip"] || req.connection.remoteAddress);
            const time = moment().format("YYYY-MM-DD hh:mm:ss");
            const secret = 'adminsystem';
            console.log('getadmin.username',getadmin.username);
            const token = jwt.sign(
              {
                username: getadmin.username,
                time: time,
    
              },
              secret
            );
            const iat = jwt.verify(token, secret).iat;
            let data = {
              username: getadmin.username,
              ip: ip_address,
              device: platform,
              iat: iat,
              browser: browser
            };
    
            const createLogLogin = await db.insert(data).into('Log_Login')
            if (!createLogLogin) {
              return res.json({ status: 400, message: "เกิดข้อผิดพลาดระบบ โปรดติดต่อแอดมิน", data: {} })
            }
            let payload = {
              username: getadmin.username,
            };
    
            // res.setHeader('set-cookie', ['access_token=' + token + '; Domain=.magiccasino.bet; Path=/; HttpOnly',]);
            // data = ({ status: 200, message: "เข้าสู่ระบบสำเร็จ", data: getadmin.username });
            return res.cookie("access_token", token).redirect('/main')
            
        //   } else {
        //     return res.json({
        //       status: 400,
        //       message: "รหัสผ่านไม่ถูกต้อง",
        //       data: {},
        //     });
        //   }
        // } else {
        //   return res.json({
        //     status: 400,
        //     message: "ไม่พบชื่อผู้ใช้ โปรดลองใหม่อีกครั้ง",
        //     data: {},
        //   });
        // }
    } catch (error) {
        console.log(error);
        res.status(401)
    }
})

router.get('/logout',authorization,async(req,res)=>{
    try {
        return res.clearCookie("access_token").redirect('/')
    } catch (error) {
        console.log(error);
    }
})


module.exports = router