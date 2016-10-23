module.exports = function () {
  return function parseExpressHttpsRedirect(req, res, next) {
  	//onsole.log(Object.keys(req));
  	//console.log(req.headers.host);
  	next();

    /*if (!req.secure) {
      res.redirect('https://' + req.headers.host + req.originalUrl);
    } else {
      next();
    }*/
  };
}
