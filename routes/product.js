const router = require("express").Router();
const { uid } = require("uid");
const {moment} = require('../module/index')
const db = require("../database/connect");

router.get("/", async (req, res) => {
  try {
    // console.log('product');
    username = req.admin;
    const getproduct = await db("tb_product")
      .select(
        'prod_id',
        'prod_name',
        db.raw("format(prod_price,2) as prod_price"),
        'prod_img',
        'prod_amount',
      )
      .orderBy("id", "asc");
      // console.log('getcus',getcus);
    if (getproduct?.length == 0) return res.render('product',{
        payload: [],
        username: username,
        count: getproduct.length,
        status: true,
      })
    
    return res.render("product", {
      payload: getproduct,
      username: username,
      count: getproduct.length,
      status: true,
    });
  } catch (error) {
    console.log(error);
  }
});

router.get('/addProduct',async(req,res)=>{
    try {
        const gettype = await db('tb_product_type')
        .select('*')
        .orderBy('id','asc')
        // console.log('gettype',gettype);
        return res.render('create-prod',{type:gettype,status:true,username:req.admin})

    } catch (error) {
        console.log(error);
    }
})

router.post('/addProduct/insert',async(req,res)=>{
    try {
        const body = req.body
        // console.log('body',body);
        let datainsert = {
            prod_id : 'prod_'+uid(3),
            prod_type_id :body.prod_type_id,
            prod_name:body.prod_name,
            prod_detail:body.prod_detail,
            prod_price:body.prod_price,
            prod_img:body.prod_img,
            prod_amount:body.prod_amount
        }
        const insert = await db('tb_product').insert(datainsert)
        if(!insert) return res.render('create-prod',{
            error:true,
            msg:'เกิดข้อผิดพลาด ไม่สามารถเพิ่มได้',
            status:true,
            username:req.admin
        })
        const gettype = await db('tb_product_type')
        .select('*')
        .orderBy('id','asc')
        return res.render('create-prod',{
            success:true,
            status:true,
            username:req.admin,
            msg:'สำเร็จ',
            type:gettype
        })
    } catch (error) {
        console.log(error);
    }
})

router.get('/editProduct/:id',async(req,res)=>{
    try {
        // console.log('eidtProduct');
         const body = req.params
         const getdata = await db("tb_product").select(
            '*',
            db.raw("(select prod_type_name from tb_product_type where prod_type_id = tb_product.prod_type_id) as prod_type_name")
         ).where({prod_id:body.id}).first()
        //  console.log('getdata',getdata);
         return res.render('edit-prod',{
            status:true,
            payload:getdata
         })
    } catch (error) {
        console.log(error);
    }
})

router.get('/buy/create',async(req,res)=>{
    try {
        const product = await db('tb_product').select('*').orderBy('id','desc')
        // console.log('product',product);
        return res.render('create-buy',{product:product,status:true,username:req.admin})
    } catch (error) {
        console.log(error);        
    }
})

router.post('/buy/insert',async(req,res)=>{
    try {
        const body = req.body
        // console.log('buy insertdata');
        // console.log('body',body);
        let dataInsert = []
        let product_id = body.prod_id
        let product_amount = body.prod_amount
        let order_buy_total = 0
        let order_buy_id = 'buy_id'+uid(10)

        for (let index = 1; index < product_id.length; index++) {
            const e_id = product_id[index];
            const e_amount = product_amount[index];
            const getpdName = await db('tb_product').select('prod_name').where({prod_id:e_id}).first()
            dataInsert.push({
                order_buy_id:order_buy_id,
                prod_id : e_id,
                prod_name:getpdName.prod_name,
                prod_price:0,
                prod_amount:e_amount,
                total:0,
                status:0
            })
            order_buy_total += Number(e_amount)
        }
        // console.log('dataInsert',dataInsert);
        
        const getemp = await db('tb_employee').select('*').where({username:req.admin}).first()
        const insert = await db('tb_order_buy').insert({
            order_buy_id:order_buy_id,
            emp_id:getemp.emp_id,
            emp_fname:getemp.emp_fname,
            emp_lname : getemp.emp_lname,
            order_buy_amount : product_id.length,
            order_buy_total: order_buy_total,
            order_buy_status:0
        })
        if(!insert) return res.render('create-buy',{
            status:true,
            username:req.admin,
            error:true,
            msg:'เกิดข้อผิดพลาดไม่สามารถบันทึกได้'
        })
        const insertDetail = await db('tb_order_buy_detail').insert(dataInsert)
        
        return res.render('create-buy',{
            status:true,
            username:req.admin,
            success:true,
            msg:'สำเร็จ'
        }) 
    } catch (error) {
        console.log(error);
    }
})

module.exports = router;
