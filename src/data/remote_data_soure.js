const express = require(`express`);
const service = express.Router();

// Static Strings
const supabaseURL = `https://ijtsrdxvxgoewztdnwqo.supabase.co`;
const supabaseKey = `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlqdHNyZHh2eGdvZXd6dGRud3FvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MTc4NTU5MDAsImV4cCI6MjAzMzQzMTkwMH0.Aeh-1_DQ05iMI068xzGt51gLo_-zbJ5-k2ChKEJc1nI`;
const imgurURL = `https://api.imgur.com/3/image`;
const imgurClientId = `2920335c9d2b497	`;

// Multer
const multer = require('multer');
const upload = multer({
  dest: './uploads/'
});

// FS
const fs = require('fs');

// Supabase Client
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(supabaseURL, supabaseKey);

// Imgur Client
const { ImgurClient } = require('imgur');
const imgurUploader = require('imgur-uploader');
const client = new ImgurClient({
  clientId: imgurClientId,
  clientSecret: imgurClientId
});

// Body-Parser
const bodyParser = require(`body-parser`);
const { Console } = require('console');
service.use(bodyParser.json());
service.use(bodyParser.urlencoded({ extended: true }));

// Update Portofolio
service.post(`/update-portofolio`, upload.single(`file`) , async (req, res) => {
  try {
    const {
      id,
      title,
      description,  
      source_url    
    } = req.body;
    let imageUrl = ``;

    console.log(`ID : ${id}\nTitle : ${title}`);

    const file = req.file;

    // Validate File
    if (file) {

      // Format to formData
      const formData = new FormData();

      // Format to Blob object
      const fileBlob = new Blob([fs.readFileSync(file.path)]);
      formData.append('image', fileBlob, {
        filename: file.originalname
      });

      const imgurResponse = await fetch(`${imgurURL}`, {
        method: `POST`,
        headers: {
          "Authorization": `Client-ID ${imgurClientId}`,
        },
        body: formData
      });
      if (!imgurResponse.ok) {
        // Returns Error Message
        return res.status(imgurResponse.status).send(`Imgur Upload Error : ${imgurResponse.statusText}`);
      }
      // Retrive Imgur Link
      const imgur = await imgurResponse.json();
      imageUrl = imgur.data.link
    }

    let bodyForm = {
      title: title,
      description: description,
      source_url: source_url}

      if(imageUrl !== ``) {
        bodyForm.image_url = imageUrl
      }

    const response = await supabase.from(`portofolios`).update(bodyForm).eq(`id`, id);

    if(response.error) {
      res.status(response.status).send(`Internal Server Problem : ${response.statusText}`);
    }
    res.status(200).send(`Data Successfully Updated`);
  } catch (error) {
    res.status(500).send(`Client Exception - ${error}`);
  }
});

// Get Portofolio Data by ID
service.get(`/get-portofolio`, async (req, res) => {
  try {
    const id = req.query.id;

    console.log(`ID Equals : `, id)

    const response = await supabase.from(`portofolios`).select(`*`).eq(`id`, parseInt(id));
    if(response.error) {
      res.status(response.status).send(`Internal Server Problem : ${response.statusText}`);
    }
    const dataResult = await response.data;    
    res.send(dataResult);
  } catch (error) {
    res.status(500).send(`Client Exception - ${error}`);
  }
});

// Get All Portofolios
service.get(`/get-portofolios`, async (req, res) => {
  try {    
    const response = await supabase.from(`portofolios`).select(`*`);
    if(response.error) {
      res.status(response.status).send(`Internal Server Problem : ${response.message}`);      
    }
    const dataResult = await response.data;    
    res.send(dataResult);
  } catch (error) {
    res.status(500).send(`Client Exception - ${error}`);
  }
});

// Upload Portofolio
service.post('/upload-portofolio', upload.single(`file`), async (req, res) => {
  try {
    const {
      title,
      description,
      source_url,      
    } = req.body;

    const file = req.file;

    // Validate File
    if (!file) {
      return res.status(500).send(`File is Empty`);
    }            

    // Format to formData
    const formData = new FormData();

    // Format to Blob object
    const fileBlob = new Blob([fs.readFileSync(file.path)]);
    formData.append('image', fileBlob, {filename: file.originalname});

    const imgurResponse = await fetch(`${imgurURL}`, {
      method: `POST`,
      headers: {
        "Authorization" : `Client-ID ${imgurClientId}`,        
      },
        body: formData
    });
    if(!imgurResponse.ok) {
      // Returns Error Message
      return res.status(imgurResponse.status).send(`Imgur Upload Error : ${imgurResponse.statusText}`);
    }
    // Retrive Imgur Link
    const imgur = await imgurResponse.json();

    const {
      data,
      error
    } = await supabase.from('portofolios').insert([{
      title: title,
      description: description,
      image_url: imgur.data.link,
      source_url: source_url
    }]);

    if (error) {
      console.error(`Error Supabase : ${error}`);
      return res.status(500).send(`Internal Server Problem : ${error.message}`);
    }
    return res.send('Portofolio Successfully Uploaded!');
  } catch (error) {
    console.error(`Client Exception - ${error}`);
    return res.status(500).send(`Failed to upload Portofolio : ${error}`);
  }
});




module.exports = service;

