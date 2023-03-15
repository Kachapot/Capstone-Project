const router = require('express').Router();
const {authorization,login} = require('../function/index')
const {useragent,moment,jwt} = require('../module/index')
const db = require('../database/connect')

router.use('/employee',authorization,require('./employee'))
router.use('/customer',authorization,require('./customer'))
router.use('/product',authorization,require('./product'))
router.use('/buy',authorization,require('./buy'))
router.use('/sell',authorization,require('./sell'))
router.use('/ship',authorization,require('./ship'))
router.use('/report',authorization,require('./report'))

router.get('/editProfile/:id',authorization,async(reqr,res)=>{
  try {
    const body = req.params
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
    if(req.query.edit) return res.render('edit-emp',{payload:getUser,status:true,menu:req.menu,msg:'แก้ไขสำเร็จ',success:true})
    return res.render('edit-emp',{payload:getUser,status:true,menu:req.menu,})
 } catch (error) {
   console.log(error);
 }
})

router.get('/',authorization,async(req,res)=>{
    if(req.cookies?.access_token){
      const getEmp = await db('tb_employee').select('*').where({username:req.admin}).first()
      if(getEmp.level < 3){
        res.redirect('/main')
      }else{
        if(req.position == 'พนักงานทั่วไป' || req.position == 'general'){
          res.redirect('/product/')
        }else if(req.position == 'พนักงานคิดเงิน' || req.position == 'cashier'){
          res.redirect('/customer/')
        }else if(req.position == 'พนักงานขนส่ง' || req.position == 'delivery'){
          res.redirect('/sell/')
        }else{
          res.render('login')
        }
      }
    }else{
      res.render('login')
    }
})

router.get('/main',authorization,async(req,res)=>{
  try {
    const body = req.query
    let startDate = body.startDate??moment().format('YYYY-MM-DD')
    let endDate = body.endDate??moment().format('YYYY-MM-DD')
    if(endDate < startDate){
      startDate = body.endDate
      endDate = body.startDate
    }
    let month_value = [0,0,0,0,0,0,0,0,0,0,0,0]
    let state_value = [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0]
    const today = moment().format('YYYY-MM-DD')
    const startMonth = moment().startOf('month').format('YYYY-MM-DD')
    const endMonth = moment().endOf('month').format('YYYY-MM-DD')
    const startYear = moment().startOf('year').format('YYYY-MM-DD')
    const endYear = moment().endOf('year').format('YYYY-MM-DD')
    const totalSell = await db('tb_order_sell_detail').select(
      db.raw(`
      sum(total) as total,
      date_format(date,'%m') as month`)
      )
    .whereRaw(`date(date) between '${startDate}' and '${endDate}'`)
    .groupBy('month')
    .orderBy('month')
    const getState = await db.fromRaw(`
    (
    select
    c.cus_address ->> "$.state" as state,
    ifnull(sum(s.order_sell_total),0) as total
    from tb_order_sell s
    inner JOIN tb_customer c on c.cus_id = s.cus_id
    where date(s.order_sell_date) between '${startDate}' and '${endDate}'
    GROUP BY c.cus_address ->> "$.state"
    )as a
    `)
    const incomeToday = await db('tb_order_sell_detail')
    .select(db.raw(`ifnull(format(sum(total),2),0) as total`))
    .whereRaw(`date(date) BETWEEN '${today}' and '${today}'`).first()
    const incomeMonth = await db('tb_order_sell_detail')
    .select(db.raw(`ifnull(format(sum(total),2),0) as total`))
    .whereRaw(`date(date) BETWEEN '${startMonth}' and '${endMonth}'`).first()
    const countTransporting = await db('tb_order_sell').select(db.raw("count(id) as count")).whereRaw("order_sell_status < 3")
    .where({order_sell_status:1}).first()
    const countBuyList = await db('tb_order_buy').count('id as count').where({order_buy_status:0})
    .where({order_buy_status : 0}).first()
    
    // loop month value
    for (let index = 0; index < totalSell.length; index++) {
      const element = totalSell[index];
      if(element.month == '01'){
        month_value[0] = +element.total
      }
      if(element.month == '02'){
        month_value[1] = +element.total
      }
      if(element.month == '03'){
        month_value[2] = +element.total
      }
      if(element.month == '04'){
        month_value[3] = +element.total
      }
      if(element.month == '05'){
        month_value[4] = +element.total
      }
      if(element.month == '06'){
        month_value[5] = +element.total
      }
      if(element.month == '07'){
        month_value[6] = +element.total
      }
      if(element.month == '08'){
        month_value[7] = +element.total
      }
      if(element.month == '09'){
        month_value[8] = +element.total
      }
      if(element.month == '10'){
        month_value[9] = +element.total
      }
      if(element.month == '11'){
        month_value[10] = +element.total
      }
      if(element.month == '12'){
        month_value[11] = +element.total
      }
    }
    
    for (let index = 0; index < getState.length; index++) {
      const element = getState[index];
      if(element.state == 'เชียงใหม่') state_value[0] = +element.total
      if(element.state == 'แม่ฮ่องสอน') state_value[1] = +element.total
      if(element.state == 'เชียงราย') state_value[2] = +element.total
      if(element.state == 'ลำพูน') state_value[3] = +element.total
      if(element.state == 'ลำปาง') state_value[4] = +element.total
      if(element.state == 'พะเยา') state_value[5] = +element.total
      if(element.state == 'แพร่') state_value[6] = +element.total
      if(element.state == 'น่าน') state_value[7] = +element.total
      if(element.state == 'อุตรดิตถ์') state_value[8] = +element.total
      if(element.state == 'ตาก') state_value[9] = +element.total
      if(element.state == 'สุโขทัย') state_value[10] = +element.total
      if(element.state == 'พิษณุโลก') state_value[11] = +element.total
      if(element.state == 'กำแพงเพรชร') state_value[12] = +element.total
      if(element.state == 'เพชรบูรณ์') state_value[13] = +element.total
      if(element.state == 'พิจิตร') state_value[0] = +element.total
    }
      let data = {
        status:true,
        menu:req.menu,
        msg:"ยินดีต้อนรับ",
        username:req.admin,
        startDate:body.startDate??today,
        endDate:body.endDate??today,
        state_value:state_value,
        month_value:month_value,
        incomeToday:incomeToday.total,
        incomeMonth:incomeMonth.total,
        countTransporting:countTransporting.count,
        countBuyList:countBuyList.count
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
        const getadmin = await db('tb_employee').select('*')
        .where({username:body.username,password:body.password})
        .first()
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
            if(getadmin.level < 3){
              return res.status(200).cookie("access_token", token).redirect('/main?level='+level)
            }else{
              if(getadmin.emp_position == 'พนักงานทั่วไป' || getadmin.emp_position == 'general'){
                return res.status(200).cookie("access_token", token).redirect('/product')
              }else if(getadmin.emp_position == 'พนักงานคิดเงิน' || getadmin.emp_position == 'cashier'){
                return res.status(200).cookie("access_token", token).redirect('/customer')
              }else if(getadmin.emp_position == 'พนักงานขนส่ง' || getadmin.emp_position == 'delivery'){
                return res.status(200).cookie("access_token", token).redirect('/sell')
              }
              
            }
            
            
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