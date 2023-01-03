const jwt = require("jsonwebtoken");
const db = require('../database/connect')

module.exports.authorization = async (req,res,next)=>{ 
  const token = req.cookie?.access_token;
  console.log('token',req.cookie);
  if (!token) {
    console.log('!token');
    return res.render('login')
  }
  try {
    const data = jwt.verify(token, process.env.TOKEN_SECRETADMIN);
    const getlog = await db.select('iat').from('Log_Login').where({username:data.username}).orderBy('id','desc').limit(1)
    if (getlog[0].iat != data.iat) {
      let data = {status:true,message:"token not valide",data:""}
      return res.render('login',data)
        // .status(401)
        .clearCookie("access_token")
        // .json({ status: 400, message: "Token Timeout", data: {} });
        
    }
    req.admin = data.username;
    return next();
  } catch (err) {
    console.log(err);
    return res.status(403).json({ status: 400, message: "catch", data: {} });
  }
}

module.exports.login = async(req,res,next)=>{
    
}
