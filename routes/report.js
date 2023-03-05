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
        ifnull(format(sum(osd.total),2),0) as total,
        date_format(os.order_sell_date,"%d-%m-%Y") as order_sell_date
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
            const getOSD = await db('tb_order_sell_detail')
            .select(db.raw(`
            prod_id,
            prod_name,
            format(prod_price,2) as prod_price,
            format(prod_amount,0) as prod_amount,
            format(total,2) as total
            `))
            .where({order_sell_id:element.order_sell_id})
            for (let ii = 0; ii < getOSD.length; ii++) {
                const ee = getOSD[ii];
                payload.push({
                    order_sell_id:ii==0?element.order_sell_id:'',
                    cus_name:ii==0?element.cus_name:'',
                    total:ii==0?element.total:'',
                    order_sell_date : ii==0?element.order_sell_date:'',
                    prod_id : ee.prod_id,
                    prod_name : ee.prod_name,
                    prod_price : ee.prod_price,
                    prod_amount:ee.prod_amount,
                    prod_total : ee.total
                })
            }
        }
        return res.render('report-income',data)
    } catch (error) {
        console.log(error);
    }
})

router.get('/income/print',async(req,res)=>{
    try {
        const body = req.query
        let startDate = moment().format('YYYY-MM-DD')
        let endDate = moment().format('YYYY-MM-DD')
        let today = moment().format('YYYY-MM-DD hh:mm:ss')
        if(body.startDate) startDate = moment(body.startDate).format('YYYY-MM-DD') 
        if(body.endDate) endDate = moment(body.endDate).format('YYYY-MM-DD') 
        const getsell = await db('tb_order_sell as os')
            .innerJoin('tb_order_sell_detail as osd', 'osd.order_sell_id', 'os.order_sell_id')
            .select(db.raw(`
            os.order_sell_id,
            concat(cus_fname,' ',cus_lname) cus_name,
            ifnull(format(sum(osd.total),2),0) as total,
            date_format(os.order_sell_date,"%d-%m-%Y") as order_sell_date
            `))
            .whereRaw(`date(os.order_sell_date) between '${startDate}' and '${endDate}'`)
            .groupBy('os.order_sell_id','os.order_sell_date')
        let tr = ''
        for (let index = 0; index < getsell.length; index++) {
            const element = getsell[index];
            const getOSD = await db('tb_order_sell_detail')
                .select(db.raw(`
                prod_id,
                prod_name,
                format(prod_price,2) as prod_price,
                format(prod_amount,0) as prod_amount,
                format(total,2) as total
                `))
                .where({order_sell_id:element.order_sell_id})
            for (let ii = 0; ii < getOSD.length; ii++) {
                const ee = getOSD[ii];
                tr += `
                <tr>
                    <th scope="row">${ii<1?element.order_sell_id:''}</th>
                    <th scope="row">${ii<1?element.cus_name:''}</th>
                    <th scope="row" style="text-align: right;">${ii<1?element.total:''}</th>
                    <th scope="row" style="text-align: center;">${ii<1?element.order_sell_date:''}</th>
                    <th scope="row">${ee.prod_id}</th>
                    <th scope="row">${ee.prod_name}</th>
                    <th scope="row" style="text-align: right;">${ee.prod_price}</th>
                    <th scope="row" style="text-align: right;">${ee.prod_amount}</th>
                    <th scope="row" style="text-align: right;">${ee.total}</th>
                </tr>
                `
            }
            
        }
        let htmlCode = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta http-equiv="X-UA-Compatible" content="IE=edge">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Document</title>
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0-alpha1/dist/css/bootstrap.min.css" rel="stylesheet" integrity="sha384-GLhlTQ8iRABdZLl6O3oVMWSktQOp6b7In1Zl3/Jr59b6EGGoI1aFkw7cmDA6j6gD" crossorigin="anonymous">
    <link rel="preconnect" href="https://fonts.googleapis.com"><link
      rel="preconnect" href="https://fonts.gstatic.com" crossorigin><link
      href="https://fonts.googleapis.com/css2?family=Prompt:wght@200&display=swap"
      rel="stylesheet"> 
    <style>
      body{font-family: 'Prompt', sans-serif;}
      table,tr,th{
        border: 1px solid;
        border-collapse: collapse;
        text-align: left;
      }
    </style>
</head>
<body>
<div class="text-center">
<h3>บริษัท เชียงใหม่เหล็กหล่อ จำกัด (สำนักงานใหญ่)</h3>
<h4>รายงานใบสั่งซื้อสินค้า</h4>
<h5>รายงานวันที่ ${startDate} ถึง ${endDate} </h5>
</div>
    <p>พิมพ์วันที่ ${today}</p>
    <table>
        <thead>
            <tr  style="background-color:lightgray;">
                <th scope="col" class="text-center">รหัสรายการสั่งซื้อสินค้า</th>
                <th scope="col" class="text-center">ชื่อผู้ซื้อ</th>
                <th scope="col" class="text-center">ยอดรวม</th>
                <th scope="col" class="text-center">วันที่ทำรายการ</th>
                <th scope="col" class="text-center">รหัสสินค้า</th>
                <th scope="col" class="text-center">ชื่อสินค้า</th>
                <th scope="col" class="text-center">ราคาต่อหน่วย</th>
                <th scope="col" class="text-center">จำนวน</th>
                <th scope="col" class="text-center">ราคารวม</th>
            </tr>
        </thead>
        <tbody>
           ${tr}
        </tbody>

    </table>
</body>
</html>
        `
    await generatePDF(req,res,htmlCode)

    }catch(err){
        console.error(err);
    }
})

router.get('/receive/print',async(req,res)=>{
    try {
        const body = req.query
        const getorderSell = await db('tb_order_sell').select('*').where({order_sell_id:body.id}).first()
        const getcus = await db('tb_customer').select('*').where({cus_id:getorderSell.cus_id}).first()
        const address = JSON.parse(getcus.cus_address)
        const getdata = await db('tb_order_sell_detail').select(
        'prod_id',
        'prod_name',
        db.raw('format(prod_price,2) as prod_price'),
        'prod_amount',
        db.raw('format(total,2) as total'),
        'total as sum'
        ).where({order_sell_id:body.id})
        let tr = ''
        for (let index = 0; index < getdata.length; index++) {
            const element = getdata[index];
            tr+=`
            <tr>
                <td scope="row" class="border-0">${element.prod_name}</td>
                <td class="border-0" style="text-align:end">${element.prod_price}</td>
                <td class="border-0" style="text-align:end">${element.prod_amount}</td>
                <td class="border-0" style="text-align:end">${element.total}</td>
            </tr>
            `
        }
        let total = getdata.map(x=>x.sum)
        let sum = total.reduce(function(a, b) {
        return a + parseInt(b.replace(",", ""), 10);
        }, 0);
        let vat = Number(sum*0.07)
        let totalsum = Number(sum+vat)
        totalsum = Number(totalsum).toLocaleString('en-US', {minimumFractionDigits: 2});
        sum = Number(sum).toLocaleString('en-US', {minimumFractionDigits: 2});
        vat = Number(vat).toLocaleString('en-US', {minimumFractionDigits: 2});
        const today = moment().format('YYYY-MM-DD hh:mm:ss')

        let htmlCode = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta http-equiv="X-UA-Compatible" content="IE=edge">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>receive</title>
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0-alpha1/dist/css/bootstrap.min.css" rel="stylesheet" integrity="sha384-GLhlTQ8iRABdZLl6O3oVMWSktQOp6b7In1Zl3/Jr59b6EGGoI1aFkw7cmDA6j6gD" crossorigin="anonymous">
    <style>
      table,tr,th{
        border:1px solid;
        border-collapse: collapse;
      }
      #receive{
        width:100%;
      }
    </style>
</head>
<body>
    <div id="receive">
        <div class="row d-flex justify-center alight-center text-center">
    <p >ใบกำกับภาษี/บิลเงินสด</p>
    </div>
    <div class="row text-center">
    <h2><p class="p-0 m-0">บริษัท เชียงใหม่เหล็กหล่อ จำกัด (สำนักงานใหญ่)</p></h2>
    </div>
    <div class="row text-center">
    <h6>เลขที่ 186 หมู่ 1 บ้านทุ่งยาว ต.สันทราย อ.สันทราย จ.เชียงใหม่ 50210 </h6>
    </div>
    <div class="row text-center">
    <h6>เลขประจำตัวผู้เสียภาษีอากร 0 5055 65002 02 3</h6>
    </div>
    <div class="row">
    <div class="col fs-4">ผู้ซื้อ ${getorderSell.cus_fname} ${getorderSell.cus_lname}</div>
    </div>
    <div class="row">
    <div class="col fs-5">ที่อยู่ ${address.ship_address??''} ต.${address.address2??''} อ.${address.locality??''} จ.${address.state??''} รหัสไปรษณีย์ ${address.postcode??''}</div>
    </div>
    <div class="row">
    <div class="col fs-5">เลขประจำตัวผู้เสียภาษีอากร ${getcus.tax_id}</div>
    </div>
    <div class="row">
    <div class="col text-end"><h6>วันที่ออกใบเสร็จ ${today}</h6></div>
    </div>
    <table class="table">
    <thead>
      <tr> 
        <th scope="col" style="text-align:center"><p>ชื่อสินค้า</p></th>
        <th scope="col" style="text-align:end"><p>ราคาต่อหน่วย(บาท)</p></th>
        <th scope="col" style="text-align:end"><p>จำนวน(ชิ้น)</p></th>
        <th scope="col" style="text-align: end;"><p>ราคารวม(บาท)</p></th>
      </tr>
    </thead>
    <tbody>
      ${tr}
      <tr>
        <td></td>
        <td></td>
        <td></td>
        <td class="text-end"><p>รวมเงิน ${sum.toLocaleString()}</p></td>
      </tr>
      <tr>
        <td></td>
        <td></td>
        <td></td>
        <td class="text-end"><p>ภาษีมูลค่าเพิ่ม 7% ${vat.toLocaleString()}</p></td>
      </tr>
      <tr>
        <td></td>
        <td></td>
        <td></td>
        <td class="text-end"><p>รวมทั้งสิ้น ${totalsum.toLocaleString()}</p></td>
      </tr>
    </tbody>
    </table>
    <div class="row text-center">
    <div class="col">
      <h3><p>ลงชื่อผู้รับเงิน.................................................ผู้รับเงิน</p></h3>
    </div>
    </div>
    </div>
</body>
</html>
        `
        await generatePDF(req,res,htmlCode)
    } catch (error) {
        console.error(error);
    }
})

async function generatePDF(req,res,htmlCode){
    const puppeteer = require('puppeteer');
        const path = require('path');
        const fs = require('fs');
          const browser = await puppeteer.launch();
          const page = await browser.newPage();
          await page.goto("https://example.com", {
            waitUntil: "networkidle2"
          });
          await page.setViewport({ width: 1680, height: 1050 });
         // Custom HTML template
        const html = htmlCode

        // Set the HTML content
        await page.setContent(html);
          const todays_date = new Date();
          const pdfPath = path.join(__dirname, 'files', todays_date.getTime() + '.pdf');
        
          // Check if the 'files' directory exists and create it if it doesn't
          const directory = path.dirname(pdfPath);
          if (!fs.existsSync(directory)) {
            fs.mkdirSync(directory, { recursive: true });
          }
        
          await page.pdf({
            path: pdfPath,
            format: "A4",
            landscape: true,
            printBackground: true,
            margin: {
              top: '20px',
              right: '20px',
              bottom: '20px',
              left: '20px'
            }
          });
        
          await browser.close();
          res.set({
            "Content-Type":"application/pdf",
            "Content-Length":page.length
          });
        return  res.status(200).sendFile(pdfPath)
}
module.exports = router