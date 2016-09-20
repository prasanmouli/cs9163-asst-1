var http = require('http'),
    swig = require('swig'),
    bodyParser = require('body-parser'),
    express = require('express'),
    crypto = require('crypto'),
    multer  = require('multer'),
    mongoose = require('mongoose'),
    config = require('./src/config.js');

var storage = multer.diskStorage({
    destination: function (req, file, callback) {
	callback(null, './public/uploads/');
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
}).single('photo');

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


/* mongoose stuff */
mongoose.connect('mongodb://localhost/photo-upload');

var photos = mongoose.model('photos', {
    name : String,
    caption : String,
    mimetype : String,
    date : {type : Date, default:Date.now}
});


/* routes */
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
	    console.log(req.fileError, err, req.file);
	    res.render('upload', {message : 'Error!! Try again. File was not uploaded. (max file size 5MB, jpeg/png/gif only)'});
	}
	else{
	    console.log(req.body, req.file);
	    if(req.file == undefined){
		res.render('upload', {message : 'Please select atleast one file.'});
	    }
	    else{
		var photo = new photos({
		    name : req.file.filename,
		    caption : req.body.caption,
		    mimetype : req.file.mimetype
		});
		photo.save();
		res.render('upload', {message : 'Upload successful!'});
	    }
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

