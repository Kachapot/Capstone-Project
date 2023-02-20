const router = require('express').Router();
const db = require('./../database/connect')
const {moment} = require('../module')

router.get('/income',async(req,res)=>{
    try {
        const body = req.query
        let startDate = moment().format('YYYY-MM-DD')
        let endDate = moment().format('YYYY-MM-DD')
        if(body.startDate) startDate = moment(body.startDate).format('YYYY-MM-DD') 
        if(body.endDate) endDate = moment(body.endDate).format('YYYY-MM-DD') 
        const getsell = await db('tb_order_sell as os')
        .innerJoin('tb_order_sell_detail as osd', 'osd.order_sell_id', 'os.order_sell_id')
        .select(db.raw(`
        os.order_sell_id,
        concat(cus_fname,' ',cus_lname) cus_name,
        ifnull(sum(osd.total),0) as total,
        os.order_sell_date
        `))
        .whereRaw(`date(os.order_sell_date) between '${startDate}' and '${endDate}'`)
        .groupBy('os.order_sell_id','os.order_sell_date')
        let payload = []
        let data = {
            status:true,
            menu:req.menu,
            username:req.admin,
            startDate:startDate,
            endDate:endDate,
            count:getsell.length,
            payload:payload
        }
        if(!getsell) return res.render('report-income',data)
        for (let index = 0; index < getsell.length; index++) {
            const element = getsell[index];
            const getdetail = await db('tb_order_sell_detail')
            .select(db.raw(`
            prod_id,
            prod_name,
            format(prod_price,2) as prod_price,
            format(prod_amount,0) as prod_amount,
            format(total,2) as total
            `))
            .where({order_sell_id:element.order_sell_id})
            payload.push({
                order_sell_id:element.order_sell_id,
                cus_name:element.cus_name,
                total :element.total,
                detail:getdetail
            })
        }
        console.log('data',data);
        return res.render('report-income',data)
    } catch (error) {
        console.log(error);
    }
})
module.exports = router