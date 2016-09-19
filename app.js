var http = require('http'),
    swig = require('swig'),
    bodyParser = require('body-parser'),
    express = require('express'),
    crypto = require('crypto'),
    multer  = require('multer'),
    config = require('./src/config.js');

var storage = multer.diskStorage({
    destination: function (req, file, callback) {
	callback(null, './uploads/');
    },
    filename: function (req, file, callback) {
	var md5sum = crypto.createHash('md5').update(file.originalname);
	callback(null, Date.now()+'.'+md5sum.digest('hex'));
    }
});
var upload = multer({
    storage : storage,
    limits : {
	fileSize : config.UPLOAD.MAX_FILE_SIZE
    },
    fileFilter : function(req, file, callback){
	if(file.mimetype !== 'image/png' && file.mimetype !== 'image/jpeg' && file.mimetype !== 'image/gif'){
	    req.fileError = 'jpeg/png/gif only';
	    return callback(null, false, new Error('FileError: not jpeg/png/gif'));
	}
	callback(null, true);
    }
}).array('photo', config.UPLOAD.FILE_LIMIT);

var app = express();

app.set('port', config.PORT);
app.engine('html', swig.renderFile);
app.set('view engine', 'html');
app.set('views', __dirname + '/views');
app.use('/public', express.static(__dirname + '/public'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.listen(app.get('port'), () => {
    console.log('Server listening on '+app.get('port'));
});

app.get('/', function(req, res){
    if(!checkSession())
	res.redirect('/login');
    else
	res.redirect('/home');
});

app.get('/home', function(req, res){
    if(!checkSession())
	res.redirect('/login');
    else{
	res.render('home', {});
    }
});

app.post('/upload', function(req, res){
    upload(req, res, function(err){
	if(req.fileError || err){
	    console.log(req.fileError, err, req.files);
	    res.render('upload', {message : 'Error!! Try again. 1 or more files were not uploaded. (limit to 5 files, max file size 5MB, jpeg/png/gif only)'});
	}
	else{
	    console.log(req.body, req.files);
	    res.render('upload', {message : 'Upload successful!'});
	}
    });    
});

app.get('/photos', function(req, res){
    res.render('photos');
});

// placeholder SESSION variable until sessions is implemented
function checkSession(){
    return (typeof SESSION != undefined);
}


/*
app.use(express.static(__dirname+'/public', { maxAge: 31557600000 }));
*/
