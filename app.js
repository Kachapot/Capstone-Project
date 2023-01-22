const express = require('express')
const app = express()
var exphbs = require('express-handlebars')
var path = require('path');
const bodyParser = require('body-parser')
const mysql = require('mysql2')
const cookieParser = require('cookie-parser')
require('dotenv').config();


const port = process.env.PORT||5000

app.use(bodyParser.urlencoded({extended:false}))
app.use(bodyParser.json())

// Static Files
app.use('/public', express.static(path.join(__dirname, 'public')))
// app.use(express.static("uploads"));
app.use(express.json())
app.use(cookieParser())

app.engine('hbs',exphbs.engine({extname:'.hbs'}))
app.set('view engine','hbs');
// app.get('/',(req,res)=>{res.render('login')})
app.use('/',require('./routes'))


app.listen(port,()=>console.log('using port:'+port))