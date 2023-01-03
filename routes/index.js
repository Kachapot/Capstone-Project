const router = require('express').Router();
const {authorization,login} = require('../function/index')
const {useragent,moment,jwt} = require('../module/index')
const db = require('../database/connect')

router.get('/',authorization,(req,res)=>{
    console.log('req.admin',req.admin);
    if(req.admin){
        res.render('index',req.admin)
    }
})

router.post('/login',async (req,res)=>{
    try {
        console.log('login');
        const body = req.body
        const getadmin = await db('admin').select('*').where({ username: body.username,password:body.password }).first()
        console.log('getadmin',getadmin);
        if (!getadmin || getadmin?.status != 1) {
            let data = ({ status: 400, message: "บัญขีถูกระงับ", data: {} });
            return res.render('login',data)
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
            data = ({ status: 200, message: "เข้าสู่ระบบสำเร็จ", data: payload });
            return res
            .cookie("access_token", token, {
              httpOnly: true,
              secure: process.env.NODE_ENV === "production",
              domain:process.env.NODE_ENV === "production" ? '.longtests.com':"localhost",
            })
            .render('index',data)
            
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


module.exports = router