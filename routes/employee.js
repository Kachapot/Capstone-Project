const router = require('express').Router();
const {authorization,login} = require('../function/index')
const {useragent,moment,jwt} = require('../module/index')

router.post('/',async (req,res)=>{
    try {
        const body = req.body
        let payload = []
        const getEmp = await db('admin').select('*').where({type:'employee'})
        if(!getEmp) return payload = []
        payload = getEmp
        return res.render('employee',payload)
    } catch (error) {
        console.log(error);
    }
})


module.exports = router