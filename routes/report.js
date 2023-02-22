const router = require('express').Router();
const db = require('./../database/connect')
const {moment,PDFDocument} = require('../module')
const handlebars = require('handlebars');
const fs = require('fs');


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
        const query = req.query
        console.log('query',query);
// Define the data object to pass to the HBS template
const data = {
    title: 'My PDF Report',
    content: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit.'
  };
  
  // Load the HBS template
  const path = 'views/report-income.hbs';
  const template = await handlebars.render(fs.readFileSync("<h1>Hello World</h1>", 'utf8'));
  
  // Create a new PDF document
  const doc = new PDFDocument();
  
  // Pipe the PDF document to a file
  const stream = fs.createWriteStream('output.pdf');
  doc.pipe(stream);
  
  // Set the response headers to open the file in the browser
  res.setHeader('Content-disposition', 'inline; filename="output.pdf"');
  res.setHeader('Content-type', 'application/pdf');
  
  // Render the HBS template with the data and add it to the PDF document
  const html = template(data);
  doc.text(html);
  
  // Finalize the PDF document and end the response
  doc.end();
  stream.on('finish', function() {
    res.end();
  });
    } catch (error) {
        console.log(error);
    }
})
module.exports = router