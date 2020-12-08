const express = require('express');
const crypto = require('crypto');
const multer = require('multer');
const hbs = require('hbs');
const app = express();
const folder = require('./folder.js');
const port = 3000;

const GridFsStorage = require('multer-gridfs-storage');
const { MongoClient, ObjectId } = require('mongodb');
const mongoURI = 'mongodb://localhost:27017/test';
// localstorage
// const upload = multer({ dest: 'files' });
// const storageConfig = multer.diskStorage({
//   destination: (req, file, cb) => {
//     cb(null, 'files');
//   },
//   filename: (req, file, cb) => {
//     cb(null, Date.now() + '-' + file.originalname);
//   },
// });

//storage for mongodb
const storage = new GridFsStorage({
  url: mongoURI,
  file: (req, file) => {
    return new Promise((resolve, reject) => {
      crypto.randomBytes(16, (err, buf) => {
        if (err) {
          return reject(err);
        }
        const filename = file.originalname;
        const fileInfo = {
          filename: filename,
          bucketName: 'uploads',
        };
        resolve(fileInfo);
      });
    });
  },
});

const upload = multer({ storage });
app.use(express.static(__dirname));
app.use(multer({ storage: storage }).single('filedata'));
app.set('view engine', 'hbs');
hbs.registerPartials(__dirname + '/views/partial');

MongoClient.connect(mongoURI, { useUnifiedTopology: true }, (err, client) => {
  if (err) return console.log('error into db', err);
  db = client.db('test');
  app.listen(port, () => console.log(`Example app listening on port port!`));
});

app.get('/', (req, res) => {
  // let links = folder.getFiles('./files');
  db.collection('uploads.files')
    .find()
    .toArray((err, result) => {
      const links = result.map((elem) => elem._id);
      console.log(links);
      if (err) return console.log('err', err);
      res.render('index', {
        title: 'Main page',
        description: 'There are your files',
        links: links,
      });
    });
});

app.get('/files/:id', (req, res) => {
  let filename = req.params.id;

  db.collection('uploads').findOne(
    { _id: ObjectId(filename) },
    (err, result) => {
      if (err) return console.log('err', err);
      res.send(result.file.buffer);
    }
  );
});

app.get('/upload', (req, res) => {
  res.render('upload', {
    title: 'Upload files',
    description: 'Drop your files here',
  });
});
app.post('/upload', upload.single('filedata'), (req, res, next) => {
  let filedata = req.file;
  if (!filedata) return res.send('Error with a file');
  let encode_file = filedata.toString('base64');
  let finalFile = {
    contentType: req.file.mimetype,
    file: encode_file,
  };
  db.collection('mycollection').insertOne(finalFile, (err, result) => {
    if (err) return console.log('err in insert', err);
    console.log('saved to database');
    res.redirect('/');
  });
});
