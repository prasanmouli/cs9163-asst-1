var http = require('http'),
    swig = require('swig'),
    bodyParser = require('body-parser'),
    express = require('express'),
    config = require('./src/config.js')

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
    console.log(req.body);
    res.render('upload', {message : 'Upload successful!'});
});


// placeholder SESSION_SET variable until sessions is implemented
function checkSession(){
    return (typeof SESSION_SET != undefined);
}


/*
app.use(express.static(__dirname+'/public', { maxAge: 31557600000 }));
*/
