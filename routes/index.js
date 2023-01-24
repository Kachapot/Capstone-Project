const router = require('express').Router();
const {authorization,login} = require('../function/index')
const {useragent,moment,jwt} = require('../module/index')
const db = require('../database/connect')
const escapeHtml = require('escape-html');

router.use('/employee',authorization,require('./employee'))
router.use('/customer',authorization,require('./customer'))
router.use('/product',authorization,require('./product'))
router.use('/buy',authorization,require('./buy'))
router.use('/sell',authorization)

router.get('/',authorization,(req,res)=>{
    // console.log('cookie',req);
    if(req.cookies?.access_token){
      res.redirect('/main')
    }else{
      res.render('login')
    }
})

router.get('/map',async(req,res)=>{
  try {
    return res.render('map',{status:false})
  } catch (error) {
    console.log(error);
  }
})

router.get('/main',authorization,async(req,res)=>{
  try {
    // console.log('main');
    const body = req.query
    // return console.log('body',body);
      let data = {
        status:true,
        menu:req.menu,
        msg:"ยินดีต้อนรับ",
        username:req.admin
      }
      res.render('index',data)
    
    
  } catch (error) {
    console.log(error);
    return res.status(401)
  }
})

router.post('/login',async (req,res)=>{
    try {
        const body = req.body
        // console.log('login');
        // console.log('body',body);
        const getadmin = await db('tb_employee').select('*')
        .where({username:body.username,password:body.password})
        .first()
        // console.log('getadmin',getadmin);
        if (!getadmin) {
            let data = ({ status: 400, message: "ไม่พบผู้ใช้นี้"});
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
            // console.log('getadmin.username',getadmin.username);
            const token = jwt.sign(
              {
                username: getadmin.username,
                level : getadmin.level,
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
    
            const createLogLogin = await db.insert(data).into('tb_log_login')
            if (!createLogLogin) {
              return res.json({ status: 400, message: "เกิดข้อผิดพลาดระบบ โปรดติดต่อแอดมิน", data: {} })
            }
            let payload = {
              username: getadmin.username,
            };
            console.log('login all passed');
            // res.setHeader('set-cookie', ['access_token=' + token + '; Domain=.magiccasino.bet; Path=/; HttpOnly',]);
            // data = ({ status: 200, message: "เข้าสู่ระบบสำเร็จ", data: getadmin.username });
            let level = encodeURIComponent(getadmin.level)
            return res.status(200).cookie("access_token", token).redirect('/main?level='+level)
            
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