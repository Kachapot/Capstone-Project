const router = require('express').Router();
const db = require('./../database/connect')
const {moment} = require('../module')


router.get('/income',async(req,res)=>{
    try {
        const body = req.query
        // console.log('body',body);
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
                order_sell_date:element.order_sell_date,
                detail:getdetail
            })
        }
        // console.log('data',data);
        return res.render('report-income',data)
    } catch (error) {
        console.log(error);
    }
})
router.get('/income/print',async(req,res)=>{
    try {
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
        const html = `
        <!DOCTYPE html>
        <html>
            <head>
            <meta charset="utf-8">
            <title>PDF Title</title>
            <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0-alpha1/dist/css/bootstrap.min.css" rel="stylesheet" integrity="sha384-GLhlTQ8iRABdZLl6O3oVMWSktQOp6b7In1Zl3/Jr59b6EGGoI1aFkw7cmDA6j6gD" crossorigin="anonymous">
            </head>
            <body>
            <table class="table">
            {{#each payload}}
            <thead class="table-light">
              <tr>
                <th scope="col">รหัสรายการสั่งซื้อสินค้า</th>
                <th scope="col">ชื่อผู้ซื้อ</th>
                <th scope="col">ยอดรวม</th>
                <th scope="col">วันที่ทำรายการ</th>
                <th scope="col"></th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <th scope="row">{{order_sell_id}}</th>
                <th scope="row">{{cus_name}}</th>
                <th scope="row">{{total}}</th>
                <th scope="row">{{order_sell_date}}</th>
                <th scope="row"></th>
              </tr>
            </tbody>
    
            <thead class="table-light">
              <tr>
                <th scope="col">รหัสสินค้า</th>
                <th scope="col">ชื่อสินค้า</th>
                <th scope="col">ราคาต่อหน่วย</th>
                <th scope="col">จำนวน</th>
                <th scope="col">ราคารวม</th>
              </tr>
            </thead>
            <tbody>
              {{#each detail}}
              <tr>
                <th scope="row">{{prod_id}}</th>
                <th scope="row">{{prod_name}}</th>
                <th scope="row">{{prod_price}}</th>
                <th scope="row">{{prod_amount}}</th>
                <th scope="row">{{total}}</th>
              </tr>
              {{/each}}
            </tbody>
            <hr>
            {{/each}}
          </table>
            </body>
        </html>
        `;

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
            printBackground: true,
            displayHeaderFooter: true,
            headerTemplate: `<div style="font-size:7px;white-space:nowrap;margin-left:38px;">
                                ${new Date().toDateString()}
                                <span style="margin-left: 10px;">Generated PDF</span>
                            </div>`,
            footerTemplate: `<div style="font-size:7px;white-space:nowrap;margin-left:38px;width:100%;">
                                Generated PDF
                                <span style="display:inline-block;float:right;margin-right:10px;">
                                    <span class="pageNumber"></span> / <span class="totalPages"></span>
                                </span>
                            </div>`,
            margin: {
              top: '38px',
              right: '38px',
              bottom: '38px',
              left: '38px'
            }
          });
        
          await browser.close();
          res.set({
            "Content-Type":"application/pdf",
            "Content-Length":page.length
          });
        return  res.status(200).sendFile(pdfPath)
    }catch(err){
        console.error(err);
    }
})
module.exports = router