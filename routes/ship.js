const router = require("express").Router();
const { uid } = require("uid");
const { moment } = require("../module/index");
const { paginate, page_PN } = require("./function");
const db = require("../database/connect");

router.get("/:id", async (req, res) => {
  try {
    const body = req.params;
    const getorderSell = await db("tb_order_sell")
      .select("*")
      .where({ order_sell_id: body.id })
      .first();
      // console.log('getorderSell',getorderSell);
    const getcus = await db("tb_customer")
      .select("*")
      .where({ cus_id: getorderSell.cus_id })
      .first();
    const address = JSON.parse(getcus.cus_address);
    const getdata = await db("tb_order_sell_detail")
      .select(
        "prod_id",
        "prod_name",
        db.raw("format(prod_price,2) as prod_price"),
        "prod_amount",
        db.raw("format(total,2) as total")
      )
      .where({ order_sell_id: body.id });
    if (!getdata) {
      let msg = encodeURIComponent("ไม่พบข้อมูล");
      return res.redirect("/sell/?error=" + msg);
    }
    const location = getcus.cus_location
      ? JSON.parse(getcus.cus_location)
      : { lat: 18.809753815121315, lng: 98.95262678679745 };
    let data = {
      status: true,
      menu: req.menu,
      username: req.admin,
      payload: getdata,
      count: getdata.length,
      id: body.id,
      cus_name: getorderSell.cus_fname + " " + getorderSell.cus_lname,
      location: JSON.stringify(location),
      ship_address: address.ship_address,
      address2: 'ต.'+address.address2,
      locality: 'อ.'+address.locality,
      state: 'จ.'+address.state,
      postcode: 'รหัสไปรษณีย์ '+address.postcode,
    };
    if (getorderSell.order_sell_status == 1) {
      data["status1"] = true;
    } else if (getorderSell.order_sell_status == 2) {
      data["status2"] = true;
    }
    if (req.query.error) {
      data["error"] = { msg: req.query.error };
    }
    if(req.query.success){
    data["success"] = { msg: req.query.success };
    }
    return res.render("showdata-ship", data);
  } catch (error) {
    console.log(error);
  }
});

router.get("/approve/:id", async (req, res) => {
  try {
    const body = req.params
    console.log('body',body);
    const updateStatus = await db("tb_order_sell").update({order_sell_status: 2}).where({order_sell_id:body.id});
    if(!updateStatus){
        return res.redirect(`/ship/${body.id}?error=`+encodeURIComponent('เกิดข้อผิดพลาดบางอย่างไม่สามารถทำรายการได้'))
    }
    return res.redirect(`/ship/${body.id}?success=`+encodeURIComponent('เข้าสู่สถานะขนส่ง'))
  } catch (error) {
    console.log(error);
  }
});

router.get("/confirm/:id", async (req, res) => {
    try {
      const body = req.params
      const updateStatus = await db("tb_order_sell").update({order_sell_status: 3}).where({order_sell_id:body.id});
      if(!updateStatus){
          return res.redirect(`/ship/${body.id}?error=`+encodeURIComponent('เกิดข้อผิดพลาดบางอย่างไม่สามารถทำรายการได้'))
      }
      return res.redirect(`/ship/${body.id}?success=`+encodeURIComponent('สถานะขนส่งสำเร็จ'))
    } catch (error) {
      console.log(error);
    }
  });

  router.get("/cancel/:id", async (req, res) => {
    try {
      const body = req.params
      const updateStatus = await db("tb_order_sell").update({order_sell_status: 4}).where({order_sell_id:body.id});
      if(!updateStatus){
          return res.redirect(`/ship/${body.id}?error=`+encodeURIComponent('เกิดข้อผิดพลาดบางอย่างไม่สามารถทำรายการได้'))
      }
      return res.redirect(`/ship/${body.id}?success=`+encodeURIComponent('ยกเลิกสำเร็จ'))
    } catch (error) {
      console.log(error);
    }
  });

router.get("/delete/:id", async (req, res) => {
  try {
    const body = req.params;
    const getUser = await db("tb_order_sell")
      .where({ order_sell_id: body.id })
      .first();
    if (!getUser) {
      let deleted = encodeURIComponent("ไม่พบยูสเซอร์");
      return res.redirect("/sell/?deleted=" + deleted);
    }
    if (getUser.level < 1) {
      let deleted = encodeURIComponent("ไม่สามารถลบได้");
      return res.redirect("/sell/?deleted=" + deleted);
    }
    const deleteUser = await db("tb_order_sell")
      .where({ order_sell_id: body.id })
      .del();
    const deleteDetail = await db("tb_order_sell_detail")
      .where({ order_sell_id: body.id })
      .del();
    let deleted = encodeURIComponent("ลบข้อมูลสำเร็จ");
    return res.redirect("/sell/?deleted=" + deleted);
  } catch (error) {
    console.log(error);
  }
});

module.exports = router;
