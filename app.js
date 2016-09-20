var http = require('http'), // http server
    swig = require('swig'), // javascript template engine
    bodyParser = require('body-parser'), // middleware for parsing request bodies
    express = require('express'), // framework for node.js
    crypto = require('crypto'), 
    multer  = require('multer'), // multipart form data handling
    mongoose = require('mongoose'), // mongodb object modeling
    config = require('./src/config.js'); // global configuration params



/** Multer **/
/* 1. set destination folder */
/* 2. define naming convention for files saved */
/* 3. set upload file size limit */
/* 4. allow only png/jpeg/gif files */

var storage = multer.diskStorage({
    destination: function (req, file, callback) {
	callback(null, './public/uploads/');
    },
    filename: function (req, file, callback) {
	var md5sum = crypto.createHash('md5').update(file.originalname);
	callback(null, Date.now()+'-'+md5sum.digest('hex'));
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



/** Express configuration **/

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



/** Mongoose configuration **/

/* MongoDB databases and collections need NOT be created before running the app. They are created on the fly if they don't already exist. */

/* connect to 'photo-upload' db */
mongoose.connect('mongodb://localhost/photo-upload');

/* define mongodb model for 'photos' collection */
var photos = mongoose.model('photos', {
    name : String,
    caption : String,
    mimetype : String,
    date : {type : Date, default:Date.now}
});



/** Routes configuration **/

app.get('/', function(req, res){
    res.redirect('/home');
});

/* home page -> renders './views/home.html' */
app.get('/home', function(req, res){
    res.render('home', {});
});

/* handle POST uploads -> renders './views/upload.html' */
app.post('/upload', function(req, res){
    upload(req, res, function(err){
	if(req.fileError || err){
	    console.log(req.fileError, err, req.file);
	    res.render('upload', {message : 'Error!! Try again. File was not uploaded. (max file size 5MB, jpeg/png/gif only)'});
	}
	else{
	    if(req.file == undefined){
		res.render('upload', {message : 'Please select atleast one file.'});
	    }
	    else{
		/* create a new 'photos' collection and save in 'photo-upload' */
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


/* view photos -> renders './views/photos.html' */

/* 1. :page is the GET parameter indicating page number */
/* 2. find documents in 'photos' sorted by date */
/* 3. documents are sliced based on page number and sent to the template */

app.get('/photos/:page', function(req, res){

    var page = parseInt(req.params.page);
    if(page == NaN)
	res.render('photos', {vals : inter, page : page, len : 0});
	
    photos.find().sort({"date":"-1"}).select({_id:0, name:1, caption:1, mimetype:1}).exec(function(err, vals){
	var inter = vals.slice(page*10-10, page*10);	
	if(inter.length == 0 || page <= 0){
	    res.render('photos', {vals : inter, page : page, len : 0});
	}
	else{
	    res.render('photos', {vals : inter, page : page, len : 10});
	}
    });
    
});
