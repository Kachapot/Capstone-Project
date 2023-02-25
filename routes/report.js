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
        let htmlCode = `
        <!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta http-equiv="X-UA-Compatible" content="IE=edge">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Document</title>
      <link
      href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0-alpha1/dist/css/bootstrap.min.css"
      rel="stylesheet"
      integrity="sha384-GLhlTQ8iRABdZLl6O3oVMWSktQOp6b7In1Zl3/Jr59b6EGGoI1aFkw7cmDA6j6gD"
      crossorigin="anonymous">
      <link rel="preconnect" href="https://fonts.googleapis.com"><link
      rel="preconnect" href="https://fonts.gstatic.com" crossorigin><link
      href="https://fonts.googleapis.com/css2?family=Prompt:wght@200&display=swap"
      rel="stylesheet"> 
</head>
<body>
  <H1>Hello world</H1>
</body>
</html>
        `
    await generatePDF(req,res,htmlCode)

    }catch(err){
        console.error(err);
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