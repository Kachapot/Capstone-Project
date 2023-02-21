const router = require("express").Router();
const { uid } = require("uid");
const {moment} = require('../module/index')
const {paginate,page_PN} = require('./function')
const db = require("../database/connect");

router.get("/", async (req, res) => {
  try {
    const body = req.query
    const limit = 10
    let page = page_PN(Number(body.page??1),body.pageType??'')
    const offset = (page-1)*limit
    let username = req.admin;
    let where = ''
    if(body.search) where = `prod_id like '%${body.search}%' or prod_name like '%${body.search}%'`
    const getproduct = await db("tb_product")
      .select(
        'prod_id',
        'prod_name',
        db.raw("format(prod_price,2) as prod_price"),
        'prod_img',
        'prod_amount',
      )
      .whereRaw(where)
      .limit(limit)
      .offset(offset)
      .orderBy("id", "asc")??[]
      const countdata = await db('tb_product').count('id as count').whereRaw(where).first()
      let all_page = Math.ceil(countdata.count/limit)
      let pagination = await paginate(page,all_page)
    if (getproduct?.length == 0) return res.render('product',{
            payload: [],
            username: username,
            count: getproduct.length,
            status: true,
            menu:req.menu,
            item:countdata.count,
            pagination:pagination
        })

    if(body.deleted){
        return res.render("product", {
            payload: getproduct,
            username: username,
            count: getproduct.length,
            status: true,
            menu:req.menu,
            item:countdata.count,
            pagination:pagination,
            deleted:{msg:body.deleted}
        });
    }
    
    return res.render("product", {
        payload: getproduct,
        username: username,
        count: getproduct.length,
        status: true,
        menu:req.menu,
        item:countdata.count,
        pagination:pagination
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
        return res.render('create-prod',{type:gettype,status:true,menu:req.menu,username:req.admin})

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
            menu:req.menu,
            username:req.admin
        })
        const gettype = await db('tb_product_type')
        .select('*')
        .orderBy('id','asc')
        return res.render('create-prod',{
            success:true,
            status:true,
            menu:req.menu,
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
            menu:req.menu,
            payload:getdata
         })
    } catch (error) {
        console.log(error);
    }
})

router.post('/editProduct/update/:id',async(req,res)=>{
    try {
        const body = req.body
        const id = req.params.id
        const update = await db('tb_product').update({
            prod_name:body.prod_name,
            prod_price:body.prod_price,
            prod_amount:body.prod_amount,
            prod_detail:body.prod_detail
        }).where({prod_id:id})
        let getdata = {
            prod_type_name:body.prod_type_name,
            prod_name:body.prod_name,
            prod_price:body.prod_price,
            prod_amount:body.prod_amount,
            prod_detail:body.prod_detail
        }
        return res.redirect('/product/editProduct/'+encodeURIComponent(id))
    } catch (error) {
        console.log(error);
    }
})

router.get('/buy/create',async(req,res)=>{
    try {
        const product = await db('tb_product').select('*').orderBy('id','desc')
        // console.log('product',product);
        return res.render('create-buy',{product:product,status:true,menu:req.menu,username:req.admin})
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
                total:0
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
            menu:req.menu,
            username:req.admin,
            error:true,
            msg:'เกิดข้อผิดพลาดไม่สามารถบันทึกได้'
        })
        const insertDetail = await db('tb_order_buy_detail').insert(dataInsert)
        
        return res.render('create-buy',{
            status:true,
            menu:req.menu,
            username:req.admin,
            success:true,
            msg:'สำเร็จ'
        }) 
    } catch (error) {
        console.log(error);
    }
})

router.get('/delete/:id',async(req,res)=>{
    try {
      const body = req.params
      // console.log(body);
      const getUser = await db('tb_product').where({prod_id:body.id}).first()
      // console.log('getUser',getUser);
      if(!getUser){
        let deleted = encodeURIComponent('ไม่พบยูสเซอร์')
        return res.redirect('/product/?deleted='+deleted)
      }
      if(getUser.level < 1){
        let deleted = encodeURIComponent('ไม่สามารถลบได้')
        return res.redirect('/product/?deleted='+deleted)
      }
      const deleteUser = await db('tb_product').where({prod_id:body.id}).del()
      let deleted = encodeURIComponent('ลบข้อมูลสำเร็จ')
      return res.redirect('/product/?deleted='+deleted)
    } catch (error) {
      console.log(error);
    }
  })

module.exports = router;
